
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

v3:
	cd Containers && make v3
	docker compose -f docker-compose-v3.yml up

cleanv1:
	docker rm -f qfstandalone

cleanv1-all:
	docker rm -f textstore qfstandalone
	docker network rm qfstandalone-net

cleanv2-all:
	docker rm -f $(shell docker ps -a -q)
	docker volume rm -f quotefinder_mongo-config quotefinder_redis-conf quotefinder_redis-data quotefinder_textstore-data

cleanv3-all:
	docker rm -f $(shell docker ps -a -q)
	docker volume rm -f quotefinder_mongo-config quotefinder_textstore-data

clean: cleanv1-all cleanv2-all cleanv3-all
	cd Containers && make clean

