
start: containers
	docker compose up

containers:
	cd Containers && make all

clean:
	cd Containers && make clean

