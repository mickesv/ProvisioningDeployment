
cwd := $(shell pwd)

v1: cleanv1
	cd Containers && make v1
	docker network create qfstandalone-net
	docker start textstore || docker run -d --network qfstandalone-net --network-alias textstore --name textstore mongo
	docker run -it --network qfstandalone-net\
		-e TEXTSTORE_HOST=textstore\
		-w /app -v $(cwd)/Containers/Version1/QFStandalone/src:/app/src\
		--name qfstandalone\
		-p 8080:3000\
		qfstandalone

v2: 
	cd Containers && make v2
	docker compose -f docker-compose-v2.yml up

cleanv1:
	docker rm -f qfstandalone

cleanv1-all:
	docker rm -f textstore qfstandalone
	docker network rm qfstandalone-net

clean: cleanv1-all
	cd Containers && make clean

