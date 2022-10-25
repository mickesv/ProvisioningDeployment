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

kube-v1: kubestart
	kubectl apply -f kubernetes-config/v1-1-qfstandalone.yaml
	sleep 3
	minikube service qfapp-service
	-kubectl get pods -o name | grep qfstandalone | xargs kubectl logs -f


.ONESHELL:
kube-v12: kubestart kube-volumes
	@kubectl apply -f kubernetes-config/v1-2-qfstandalone.yaml -l data=config
	@kubectl apply -f kubernetes-config/v1-2-qfstandalone.yaml -l app=textstore
	@export textstoreip=$$(kubectl get services/textstore-service --template='{{.spec.clusterIP}}')	
	kubectl get configmap/qfapp-config -o yaml | sed -r "s/NOTSET/$$textstoreip/" | kubectl apply -f -
	kubectl apply -f kubernetes-config/v1-2-qfstandalone.yaml -l app=qfapp
	sleep 5
	-minikube service qfapp-service
	-kubectl get pods -o name | grep qfstandalone | head -1 | xargs kubectl logs -f

kube-volumes: kubestart
	@-kubectl apply -f kubernetes-config/volumes.yaml

# Kubernetes
# --------------------
kubestart:
	minikube status || minikube start

kubestop:
	minikube stop

kubestatus:
	@echo "Deployments:"; kubectl get deployments; echo ""
	@echo "StatefulSets:"; kubectl get statefulSets; echo ""
	@echo "Pods:"; kubectl get pods; echo ""
	@echo "StorageClasses:"; kubectl get storageClass; echo ""
	@echo "PersistentVolumes:"; kubectl get persistentVolumes; echo ""
	@echo "PersistentVolumeClaims:";kubectl get persistentVolumeClaims; echo ""
#	@-kubectl logs textstore-1 --all-containers  # Checking if second replica could start ok. If volumes are misconfigured, mongodb will fail.

#	minikube dashboard &

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
	-kubectl delete --cascade='foreground' -f kubernetes-config/v1-2-qfstandalone.yaml

clean-kube-volumes:
	-kubectl delete --cascade='foreground' -f kubernetes-config/volumes.yaml
	-kubectl delete pvc --all

clean: cleanv1-all cleanv2-all cleanv3-all
	cd Containers && make clean

prune-images:
	docker rmi --force mickesv/qfstandalone:version1
