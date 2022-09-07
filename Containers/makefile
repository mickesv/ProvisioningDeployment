all: qfapp qfworker

qfapp:
	cd QFApp && docker build -t qfapp .
	touch qfapp

qfworker:
	cd QFWorker && docker build -t qfworker .
	touch qfworker

clean:
	docker rmi --force qfapp qfworker
	rm qfapp
	rm qfworker

