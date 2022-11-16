#!/usr/bin/env bash

initcommand='rs.initiate({_id: "MainRepSet", version: 1, members: [
     { _id: 0, host: "textstore-0.textstore-service.default.svc.cluster.local:27017" },
     { _id: 1, host: "textstore-1.textstore-service.default.svc.cluster.local:27017" },
     { _id: 2, host: "textstore-2.textstore-service.default.svc.cluster.local:27017" },
]});'

initwait="while('PRIMARY' != rs.status()['members'][0]['stateStr']) { sleep(1000); console.log('Waiting to become PRIMARY...'); }"

adminconf='db.getSiblingDB("admin").createUser({
      user : "main_admin",
      pwd  : "hunter2",
      roles: [ { role: "root", db: "admin" } ]
 });'

useradd='db.getSiblingDB("admin").auth("main_admin", "hunter2");
  db.getSiblingDB("admin").createUser({
    user: "kube",
    pwd: "kubeuser",
    roles: ["readWriteAnyDatabase"]});'

testinsert='db.getSiblingDB("admin").auth("main_admin", "hunter2"); use("test"); db.testcoll.insertOne({a:1}); db.testcoll.insertOne({b:2}); db.testcoll.find();'
testverify='db.getSiblingDB("admin").auth("main_admin", "hunter2"); db.getMongo().setReadPref("nearest"); use("test"); db.testcoll.find();'

case $1 in
    createsecret)
        echo "Are you sure? This will not modify the kubernetes secret and most probably mess up your configuration!"
        echo "Press Ctrl-C to abort or any other key to continue..."
        read -n 1
        openssl rand -base64 200 > ./kubernetes-config/replica-set-key.txt
        ;;
    setup)
        echo "MongoDB: Initialising as Replicaset..."
        kubectl exec -i textstore-0 -- mongosh --quiet --eval "$initcommand"
        ;;
    initwait)
        echo "MongoDB: Waiting to become PRIMARY..."
        kubectl exec -i textstore-0 -- mongosh --quiet --eval "$initwait"
        ;;
    status)
        echo "MongoDB: checking status:"
        kubectl exec -i textstore-0 -- mongosh --quiet --eval "rs.status();"
        ;;
    confadmin)
        echo "MongoDB: Adding users..."
        kubectl exec -i textstore-0 -- mongosh --quiet --eval "$adminconf"
        kubectl exec -i textstore-0 -- mongosh --quiet --eval "$useradd" 
        ;;
    'test')
        echo "MongoDB: Testing insert on textstore-0:"
        kubectl exec -i textstore-0 -- mongosh --quiet --eval "$testinsert"
        echo "MongoDB: Testing find on textstore-1:"
        kubectl exec -i textstore-1 -- mongosh --quiet --eval "$testverify"        
        ;;
    *)
        echo "usage:" $0 [createsecret, setup, confadmin, status, test]
        ;;
esac

