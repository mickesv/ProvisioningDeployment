all: v1 v2 v3

v1: qfstandalone

v2: qfapp-v2 qfworker-v2

v3: qfapp-v3 qfworker-v3

image-list:
	docker image ls

# This rule is obviously not generic since the version name is hard coded
# Keeping it here just so I know where to look for the commands needed.
qfstandalone-push:
	docker tag qfstandalone:latest mickesv/qfstandalone:version1
	docker push mickesv/qfstandalone:version1


qfstandalone:
	cd Version1/QFStandalone && docker build -t qfstandalone .
	touch qfstandalone

qfapp-v2:
	cd Version2/QFApp && docker build -t qfapp .
	touch qfapp-v2

qfworker-v2:
	cd Version2/QFWorker && docker build -t qfworker .
	touch qfworker-v2

qfapp-v3:
	cd Version3/QFApp && docker build -t qfappv3 .
	touch qfapp-v3

qfworker-v3:
	cd Version3/QFWorker && docker build -t qfworkerv3 .
	touch qfworker-v3

clean:
	docker rmi --force qfstandalone qfapp qfworker qfappv3 qfworkerv3
	rm -f qfstandalone
	rm -f qfapp-v2
	rm -f qfworker-v2
	rm -f qfapp-v3
	rm -f qfworker-v3

