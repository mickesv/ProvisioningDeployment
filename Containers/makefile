all: v1 v2

v1: qfstandalone

v2: qfapp qfworker

qfstandalone:
	cd Version1/QFStandalone && docker build -t qfstandalone .
	touch qfstandalone

qfapp:
	cd Version2/QFApp && docker build -t qfapp .
	touch qfapp

qfworker:
	cd Version2/QFWorker && docker build -t qfworker .
	touch qfworker

clean:
	docker rmi --force qfapp qfworker qfstandalone
	rm -f qfapp
	rm -f qfworker
	rm -f qfstandalone

