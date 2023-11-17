cwd := $(shell pwd)

# Setup rules
# --------------------
pull-v1:
	-docker pull mickesv/qfstandalone:version1

# Startups for each version
# --------------------

v1: pull-v1 cleanv1
#	cd Containers && make v1
	-docker network create qfstandalone-net
	-docker start textstore || docker run -d --network qfstandalone-net --network-alias textstore --name textstore mongo
	docker run -it --network qfstandalone-net\
		-e TEXTSTORE_HOST=textstore\
		-w /app -v $(cwd)/Containers/Version1/QFStandalone/src:/app/src\
		--name qfstandalone\
		-p 8080:3000\
		mickesv/qfstandalone:version1

v2: 
	cd Containers && make v2
	docker compose -f docker-compose-v2.yml up

v3:
	cd Containers && make v3
	docker compose -f docker-compose-v3.yml up

# Version Kubernetes-1.1
# --------------------
# One container in a pod
# one service to open it up to the world
# no database yet.
kube-v1: kubestart
	kubectl apply -f kubernetes-config/v1-1-qfstandalone.yaml
	sleep 3
	minikube service qfapp-service
	-kubectl get pods -o name | grep qfstandalone | xargs kubectl logs -f

# Version Kubernetes-1.2
# --------------------
# as v1-1, but also with a single database and a service to access it inside the cluster.
# configmap to store hostname for mongodb server.
.ONESHELL:
kube-v12: kubestart kube-volumes
	@kubectl apply -f kubernetes-config/v1-2-qfstandalone.yaml -l data=config
	@kubectl apply -f kubernetes-config/v1-2-qfstandalone.yaml -l app=textstore
	@export textstoreip=$$(kubectl get services/textstore-service --template='{{.spec.clusterIP}}')	
	@kubectl get configmap/qfapp-config -o yaml | sed -r "s/NOTSET/$$textstoreip/" | kubectl apply -f -
	@kubectl apply -f kubernetes-config/v1-2-qfstandalone.yaml -l app=qfapp
	@sleep 5
	@-minikube service qfapp-service
	@-kubectl get pods -o name | grep qfstandalone | head -1 | xargs kubectl logs -f


# Version Kubernetes-1.3
# --------------------
# refactor makefile
# run mongodb in replicaset (with 3 replicas)
mongo-createsecret:
	@kubernetes-config/mongodb-replicaset.sh createsecret

kube-secret:
	@-kubectl create secret generic mongodb-bootstrap-data --from-file=mongodb-keyfile=kubernetes-config/replica-set-key.txt

kube-confmap:
	@kubectl apply -f kubernetes-config/v1-3-qfstandalone.yaml -l data=config

.ONESHELL:
kube-textstore: kube-confmap
	@kubectl apply -f kubernetes-config/v1-3-qfstandalone.yaml -l app=textstore
# Store ip-number of textstore-service in ConfigMap
	@export textstoreip=$$(kubectl get cm/qfapp-config --template='{{.data.mongo_user}}:{{.data.mongo_pw}}@')$$(kubectl get services/textstore-service --template='{{.spec.clusterIP}}')	
	@kubectl get configmap/qfapp-config -o yaml | sed -r "s/NOTSET/$$textstoreip/" | kubectl apply -f -

kube-textstore-replicaset: kube-textstore
	@kubectl rollout status statefulset textstore --timeout=30s
	@sleep 10 # Beause mongodb needs some additional time to boot up within each of the pods
	@kubernetes-config/mongodb-replicaset.sh setup
	@kubernetes-config/mongodb-replicaset.sh initwait
#	@kubernetes-config/mongodb-replicaset.sh status | grep stateStr # The first line should read 'PRIMARY'
	@kubernetes-config/mongodb-replicaset.sh confadmin

# kube-mount mounts the local version of <...>/Containers/Version1/QFStandalone/src first into
# the kubernetes node (minikube). Then the v-1-3...yaml-file mounts /app/src from inside the container
# to /app/src on the kubernetes node. So now we can _almost_ change files locally and cause a reload
# of the app. The one thing more which is needed is to superimpose the default startup command of the 
# container with a "spec/command", so that nodemon uses a polling legacy-mode to watch for changes.
kube-mount: kubestart
	minikube mount --port 10001 $(cwd)/Containers/Version1/QFStandalone/src:/app/src &
# Remember to open this port in your firewall first!

kube-v13: kubestart kube-volumes kube-mount kube-secret kube-confmap kube-textstore-replicaset
	@kubectl apply -f kubernetes-config/v1-3-qfstandalone.yaml -l app=qfapp

kube-v13-test: kube-v13
	@kubernetes-config/mongodb-replicaset.sh test
	@kubectl rollout status deployment qfstandalone --timeout=30s
	@echo "Press Ctrl-C to break before continuing..."
	@sleep 4 # Just so I have a chance to break here.
	@-minikube service qfapp-service
	@-kubectl get pods -o name | grep qfstandalone | head -1 | xargs kubectl logs -f

kube-volumes: kubestart
	@-kubectl apply -f kubernetes-config/volumes.yaml

# Kubernetes
# --------------------
kubestart:
	minikube status || minikube start

kubestop:
	minikube stop

kube-enter:
	minikube ssh

kubestatus:
	-kubectl get all
# @echo "Deployments:"; kubectl get deployments; echo ""
# @echo "StatefulSets:"; kubectl get statefulSets; echo ""
# @echo "Pods:"; kubectl get pods; echo ""
# @echo "StorageClasses:"; kubectl get storageClass; echo ""
	kubectl get persistentVolumes
	kubectl get persistentVolumeClaims
#	@-kubectl logs textstore-1 --all-containers  # Checking if second replica could start ok. If volumes are misconfigured, mongodb will fail.
#	minikube dashboard &

# Documentation
# --------------------
doc:
	@emacs --batch --file ./Documentation/Provisioning-Deployment.org --eval "(org-texinfo-export-to-info)"
	@texi2pdf ./Documentation/Provisioning-Deployment.texi --command=@afourpaper -q -c -o ./Documentation/Provisioning-Deployment.pdf
	@texi2any --html --no-split ./Documentation/Provisioning-Deployment.texi -o ./Documentation/Provisioning-Deployment.html

# Cleanups
# --------------------
cleanv1:
	docker rm -f mickesv/qfstandalone:version1

cleanv1-all:
	docker rm -f textstore qfstandalone
	docker network rm qfstandalone-net
	docker network prune -f

cleanv2-all:
	docker rm -f $(shell docker ps -a -q) dummy
	docker volume rm -f quotefinder_mongo-config quotefinder_redis-conf quotefinder_redis-data quotefinder_textstore-data

cleanv3-all:
	docker rm -f $(shell docker ps -a -q) dummy
	docker volume rm -f quotefinder_mongo-config quotefinder_textstore-data

clean-kube-v1:
#	-kubectl delete -f kubernetes-config/v1-1-qfstandalone.yaml # Only need to kill the most complete one.
	-kubectl delete --cascade='foreground' -f kubernetes-config/v1-3-qfstandalone.yaml

clean-kube-volumes:
	-kubectl delete --cascade='foreground' -f kubernetes-config/volumes.yaml
	-kubectl delete pvc --all
	-kubectl delete pv --all


clean-kube-confmap:
	-kubectl delete cm/qfapp-config

clean-kube-secrets:
	-kubectl delete secret/mongodb-bootstrap-data

kube-clean: clean-kube-v1 clean-kube-volumes clean-kube-confmap clean-kube-secrets

clean: cleanv1-all cleanv2-all cleanv3-all
	cd Containers && make clean

prune-images:
	docker rmi --force mickesv/qfstandalone:version1
