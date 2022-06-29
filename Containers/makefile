all: qfapp qfworker

qfapp:
	cd QFApp && docker build -t qfapp .

qfworker:
	cd QFWorker && docker build -t qfworker .

clean:
	docker rmi qfapp qfworker

