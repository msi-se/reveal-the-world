# JOB IMAGE REQUIREMENT
az  
terraform  
python3 => pip install pynacl  
kubectl  
jq  

# LOCAL ENV VARIABLES
- export $(grep -v '^#' .env | xargs)

# ENABLE AN AZURE STORAGE TFSTATE 


# FOR DEPLOYING DATASTORE
Already actions secret:
  - ACCESS_TOKEN
  - ORG_NAME
  - REPO_NAME

- az login
- terraform init
- terraform plan -out datastore.tfplan
- terraform apply datastore.tfplan
- MONGODB_URI=$(terraform output -raw cosmos_connection_string)
- POSTGRESQL_FQDN=$(terraform output -raw posgresql_fqdn)
- POSTGRESQL_ROOT_USERNAME=$(terraform output -raw posgresql_admin_username)
- POSTGRESQL_ROOT_PASSWORD=$(terraform output -raw posgresql_admin_password)
- REPOSITORY_TOKEN=$(terraform output -raw acr_token)
- ACR_ID=$(terraform output -raw acr_id)

## create github actions secrets  
// change folder
- cd ..
// get the public key of the repo
- public_key_info=$(curl -H "Authorization: token $ACCESS_TOKEN" -H "Accept: application/vnd.github.v3+json" https://api.github.com/repos/$ORG_NAME/$REPO_NAME/actions/secrets/public-key)
- public_key_value=$(echo "$public_key_info" | jq -r '.key')
- public_key_id=$(echo "$public_key_info" | jq -r '.key_id')
// encrypt and upload all credentials
- MONGODB_URI=$(python3 encrypt-secret.py $MONGODB_URI $public_key_value)
- echo '{"encrypted_value":"'$MONGODB_URI'","key_id":"'$public_key_id'"}' > body.json
- curl -L -X PUT -H "Accept: application/vnd.github+json" -H "Authorization: Bearer $ACCESS_TOKEN" -H "X-GitHub-Api-Version: 2022-11-28" https://api.github.com/repos/$ORG_NAME/$REPO_NAME/actions/secrets/MONGODB_URI -d @body.json

- POSTGRESQL_FQDN=$(python3 encrypt-secret.py $POSTGRESQL_FQDN $public_key_value)
- echo '{"encrypted_value":"'$POSTGRESQL_FQDN'","key_id":"'$public_key_id'"}' > body.json
- curl -L -X PUT -H "Accept: application/vnd.github+json" -H "Authorization: Bearer $ACCESS_TOKEN" -H "X-GitHub-Api-Version: 2022-11-28" https://api.github.com/repos/$ORG_NAME/$REPO_NAME/actions/secrets/POSTGRESQL_FQDN -d @body.json

- POSTGRESQL_ROOT_USERNAME=$(python3 encrypt-secret.py $POSTGRESQL_ROOT_USERNAME $public_key_value)
- echo '{"encrypted_value":"'$POSTGRESQL_ROOT_USERNAME'","key_id":"'$public_key_id'"}' > body.json
- curl -L -X PUT -H "Accept: application/vnd.github+json" -H "Authorization: Bearer $ACCESS_TOKEN" -H "X-GitHub-Api-Version: 2022-11-28" https://api.github.com/repos/$ORG_NAME/$REPO_NAME/actions/secrets/POSTGRESQL_ROOT_USERNAME -d @body.json

- POSTGRESQL_ROOT_PASSWORD=$(python3 encrypt-secret.py $POSTGRESQL_ROOT_PASSWORD $public_key_value)
- echo '{"encrypted_value":"'$POSTGRESQL_ROOT_PASSWORD'","key_id":"'$public_key_id'"}' > body.json
- curl -L -X PUT -H "Accept: application/vnd.github+json" -H "Authorization: Bearer $ACCESS_TOKEN" -H "X-GitHub-Api-Version: 2022-11-28" https://api.github.com/repos/$ORG_NAME/$REPO_NAME/actions/secrets/POSTGRESQL_ROOT_PASSWORD -d @body.json

- REPOSITORY_TOKEN=$(python3 encrypt-secret.py $REPOSITORY_TOKEN $public_key_value)
- echo '{"encrypted_value":"'$REPOSITORY_TOKEN'","key_id":"'$public_key_id'"}' > body.json
- curl -L -X PUT -H "Accept: application/vnd.github+json" -H "Authorization: Bearer $ACCESS_TOKEN" -H "X-GitHub-Api-Version: 2022-11-28" https://api.github.com/repos/$ORG_NAME/$REPO_NAME/actions/secrets/REPOSITORY_TOKEN -d @body.json

- ACR_ID=$(python3 encrypt-secret.py $ACR_ID $public_key_value)
- echo '{"encrypted_value":"'$ACR_ID'","key_id":"'$public_key_id'"}' > body.json
- curl -L -X PUT -H "Accept: application/vnd.github+json" -H "Authorization: Bearer $ACCESS_TOKEN" -H "X-GitHub-Api-Version: 2022-11-28" https://api.github.com/repos/$ORG_NAME/$REPO_NAME/actions/secrets/ACR_ID -d @body.json



# deploy images to azure container registry from GitHub


# FOR DEPLOYING AKS
- az login

- echo -n $ACR_ID > ./acr_id.txt 
- terraform init
- terraform plan -out aks.tfplan
- terraform apply aks.tfplan  
- KUBERNETES_CLUSTER_NAME=$(terraform output -raw kubernetes_cluster_name)
- AKS_RESOURCE_GROUP_NAME=$(terraform output -raw resource_group_name)
- AKS_RESOURCE_GROUP_LOCATION=$(terraform output -raw resource_group_location)
- public_ip_resource_group_name=MC_${AKS_RESOURCE_GROUP_NAME}_${KUBERNETES_CLUSTER_NAME}_${AKS_RESOURCE_GROUP_LOCATION}
- APP_IP=$(az network public-ip list --resource-group $public_ip_resource_group_name --query '[0].ipAddress' --output tsv)
- az aks get-credentials --resource-group $AKS_RESOURCE_GROUP_NAME --name $KUBERNETES_CLUSTER_NAME
- kubectl get nodes

## create github actions secrets  
// change folder
- cd ..
// get the public key of the repo
- public_key_info=$(curl -H "Authorization: token $ACCESS_TOKEN" -H "Accept: application/vnd.github.v3+json" https://api.github.com/repos/$ORG_NAME/$REPO_NAME/actions/secrets/public-key)
- public_key_value=$(echo "$public_key_info" | jq -r '.key')
- public_key_id=$(echo "$public_key_info" | jq -r '.key_id')
// encrypt and upload all credentials
- KUBERNETES_CLUSTER_NAME=$(python3 encrypt-secret.py $KUBERNETES_CLUSTER_NAME $public_key_value)
- echo '{"encrypted_value":"'$KUBERNETES_CLUSTER_NAME'","key_id":"'$public_key_id'"}' > body.json
- curl -L -X PUT -H "Accept: application/vnd.github+json" -H "Authorization: Bearer $ACCESS_TOKEN" -H "X-GitHub-Api-Version: 2022-11-28" https://api.github.com/repos/$ORG_NAME/$REPO_NAME/actions/secrets/KUBERNETES_CLUSTER_NAME -d @body.json

- AKS_RESOURCE_GROUP_NAME=$(python3 encrypt-secret.py $AKS_RESOURCE_GROUP_NAME $public_key_value)
- echo '{"encrypted_value":"'$AKS_RESOURCE_GROUP_NAME'","key_id":"'$public_key_id'"}' > body.json
- curl -L -X PUT -H "Accept: application/vnd.github+json" -H "Authorization: Bearer $ACCESS_TOKEN" -H "X-GitHub-Api-Version: 2022-11-28" https://api.github.com/repos/$ORG_NAME/$REPO_NAME/actions/secrets/AKS_RESOURCE_GROUP_NAME -d @body.json

- AKS_RESOURCE_GROUP_LOCATION=$(python3 encrypt-secret.py $AKS_RESOURCE_GROUP_LOCATION $public_key_value)
- echo '{"encrypted_value":"'$AKS_RESOURCE_GROUP_LOCATION'","key_id":"'$public_key_id'"}' > body.json
- curl -L -X PUT -H "Accept: application/vnd.github+json" -H "Authorization: Bearer $ACCESS_TOKEN" -H "X-GitHub-Api-Version: 2022-11-28" https://api.github.com/repos/$ORG_NAME/$REPO_NAME/actions/secrets/AKS_RESOURCE_GROUP_LOCATION -d @body.json

- APP_IP=$(python3 encrypt-secret.py $APP_IP $public_key_value)
- echo '{"encrypted_value":"'$APP_IP'","key_id":"'$public_key_id'"}' > body.json
- curl -L -X PUT -H "Accept: application/vnd.github+json" -H "Authorization: Bearer $ACCESS_TOKEN" -H "X-GitHub-Api-Version: 2022-11-28" https://api.github.com/repos/$ORG_NAME/$REPO_NAME/actions/secrets/APP_IP -d @body.json

# K8S fusionauth (deploy from scratch)
Already actions secret:
  - FUSIONAUTH_DATABASE_USERNAME
  - FUSIONAUTH_DATABASE_PASSWORD

- az aks get-credentials --resource-group $AKS_RESOURCE_GROUP_NAME --name $KUBERNETES_CLUSTER_NAME
- kubectl get nodes
- DATABASE_URL=jdbc:postgresql://${POSTGRESQL_FQDN}:5432/fusionauth
- kubectl create secret generic posgresqlurl --from-literal=DATABASE_URL=$DATABASE_URL
- kubectl create secret generic posgresqlrootusername --from-literal=DATABASE_ROOT_USERNAME=$POSTGRESQL_ROOT_USERNAME
- kubectl create secret generic posgresqlrootpassword --from-literal=DATABASE_ROOT_PASSWORD=$POSTGRESQL_ROOT_PASSWORD
- kubectl create secret generic fusionauthdatabaseusername --from-literal=DATABASE_USERNAME=$FUSIONAUTH_DATABASE_USERNAME
- kubectl create secret generic fusionauthdatabasepassword --from-literal=DATABASE_PASSWORD=$FUSIONAUTH_DATABASE_PASSWORD
- kubectl apply -f fusionauth.yaml
- FUSION_AUTH_PUBLIC_IP=$(kubectl get service fusionauth --output jsonpath='{.status.loadBalancer.ingress[0].ip}')
- create github actions secrets
- apply kicktstart

# K8S services (deploy from scratch)
Already actions secret:
  - default_clientSecret

- az aks get-credentials --resource-group $AKS_RESOURCE_GROUP_NAME --name $KUBERNETES_CLUSTER_NAME
- kubectl get nodes

- fusionAuthURL=http://${FUSION_AUTH_PUBLIC_IP}:9011
- internalFusionAuthURL=http://${FUSION_AUTH_PUBLIC_IP}:9011
- appURL=http://${APP_IP}
- VITE_BACKEND_URL=http://${APP_IP}/api

- kubectl create secret generic mongodburi --from-literal=MONGODB_URI=$MONGODB_URI
- kubectl create secret generic fusionauthurl --from-literal=fusionAuthURL=$fusionAuthURL
- kubectl create secret generic internalfusionauthurl --from-literal=internalFusionAuthURL=$internalFusionAuthURL
- kubectl create secret generic appurl --from-literal=appURL=$appURL
- kubectl create secret generic vitebackendurl --from-literal=VITE_BACKEND_URL=$VITE_BACKEND_URL
- kubectl create secret generic defaultclientsecret --from-literal=default_clientSecret=$default_clientSecret

- kubectl apply -f analytics.yaml
- kubectl apply -f auth.yaml
- kubectl apply -f frontend.yaml
- kubectl apply -f heatmap.yaml
- kubectl apply -f pin.yaml
- kubectl apply -f update.yaml

- helm install ingress-nginx ingress-nginx/ingress-nginx \
    --set controller.replicaCount=1 \
    --set controller.nodeSelector."kubernetes\.io/os"=linux \
    --set defaultBackend.nodeSelector."kubernetes\.io/os"=linux \
    --set controller.service.externalTrafficPolicy=Local \
    --set controller.service.loadBalancerIP=$APP_IP
- kubectl get service --namespace default ingress-nginx-controller --output wide
- kubectl apply -f ingress.yaml

# K8S services update after image only (execpt ingress and fusionauth)
- az aks get-credentials --resource-group $AKS_RESOURCE_GROUP_NAME --name $KUBERNETES_CLUSTER_NAME
- kubectl get nodes

- fusionAuthURL=http://${FUSION_AUTH_PUBLIC_IP}:9011
- internalFusionAuthURL=http://${FUSION_AUTH_PUBLIC_IP}:9011
- appURL=http://${APP_IP}
- VITE_BACKEND_URL=http://${APP_IP}/api

- kubectl create secret generic mongodburi --from-literal=MONGODB_URI=$MONGODB_URI
- kubectl create secret generic fusionauthurl --from-literal=fusionAuthURL=$fusionAuthURL
- kubectl create secret generic internalfusionauthurl --from-literal=internalFusionAuthURL=$internalFusionAuthURL
- kubectl create secret generic appurl --from-literal=appURL=$appURL
- kubectl create secret generic vitebackendurl --from-literal=VITE_BACKEND_URL=$VITE_BACKEND_URL

- kubectl rollout restart deploy servicename

# K8S services update after K8S yaml file update (execpt ingress and fusionauth)
- az aks get-credentials --resource-group $AKS_RESOURCE_GROUP_NAME --name $KUBERNETES_CLUSTER_NAME
- kubectl get nodes

- fusionAuthURL=http://${FUSION_AUTH_PUBLIC_IP}:9011
- internalFusionAuthURL=http://${FUSION_AUTH_PUBLIC_IP}:9011
- appURL=http://${APP_IP}
- VITE_BACKEND_URL=http://${APP_IP}/api

- kubectl create secret generic mongodburi --from-literal=MONGODB_URI=$MONGODB_URI
- kubectl create secret generic fusionauthurl --from-literal=fusionAuthURL=$fusionAuthURL
- kubectl create secret generic internalfusionauthurl --from-literal=internalFusionAuthURL=$internalFusionAuthURL
- kubectl create secret generic appurl --from-literal=appURL=$appURL
- kubectl create secret generic vitebackendurl --from-literal=VITE_BACKEND_URL=$VITE_BACKEND_URL

- kubectl apply -f <filename>.yaml

