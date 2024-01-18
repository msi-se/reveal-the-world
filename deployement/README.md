RUN  

FOR DEPLOYING DATASTORE (once)
- az login
- terraform init
- terraform plan -out main.tfplan
- terraform apply main.tfplan
- az acr show --name rtwcr1 --query "id" --output tsv                       # ACR id to link to AKS to change
- echo "$(terraform output connection_string)" > ./outputs/cosmos.txt
- echo "$(terraform output posgresql_fqdn)" > ./outputs/posgresql_fqdn.txt
- deploy images to azure container registry from GitHub (change username and password)

FOR DEPLOYING AKS
- az login
- terraform init
- terraform plan -out main.tfplan
- terraform apply main.tfplan  
// echo "$(terraform output kube_config)" > ./outputs/azurek8s.yaml
// remove EOT in ./outputs/azurek8s.yaml
// export KUBECONFIG=./outputs/azurek8s.yaml

Move to k8s
- $kubernetes_cluster_name=$(terraform output kubernetes_cluster_name)
- $resource_group_name=$(terraform output resource_group_name)
- az aks get-credentials --resource-group $resource_group_name --name $kubernetes_cluster_name
- kubectl get nodes
- kubectl create secret generic cosmos --from-file=MONGODB_URI=../datastore-deployment/outputs/cosmos.txt
- kubectl apply -f fusionauth.yaml
- kubectl get service fusionauth --output jsonpath='{.status.loadBalancer.ingress[0].ip}' > some file.txt
- create secret with the public ip
- kubectl apply allfiles.yaml (except ingress)
- helm install ingress-nginx ingress-nginx/ingress-nginx \
    --set controller.replicaCount=1 \
    --set controller.nodeSelector."kubernetes\.io/os"=linux \
    --set defaultBackend.nodeSelector."kubernetes\.io/os"=linux \
    --set controller.service.externalTrafficPolicy=Local \
    --set controller.service.loadBalancerIP="20.118.177.37"
- kubectl get service --namespace default ingress-nginx-controller --output wide --watch
- kubectl apply ingress.yaml


====================================  
Send image to container registry (sudo)
- az acr login --name rtwcr1
- docker tag <local-image-name> rtwcr1.azurecr.io/<remote image name>:<version>
- docker push rtwcr1.azurecr.io/<remote image name>:<version>

List image container registy
- az acr repository list --name rtwcr1 --output table

====================================  
If needed
- terraform plan -destroy -out main.destroy.tfplan 
- terraform plan main.destroy.tfplan
- docker rm -f $(docker ps -a -q)
- docker rmi -f $(docker images -q)


- Step by step explained -
### 1. Create a Docker image:

```Dockerfile
FROM nginx:alpine
COPY ./path/to/your/site /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Build the image:
```bash
docker build -t your_image_name:tag .
```

### 2. Deploy the Docker image to Azure Container Registry (ACR):

1. Log in to Azure using the command:
   ```bash
   az login
   ```

2. Authenticate to your ACR:
   ```bash
   az acr login --name your_acr_name
   ```

3. Tag your Docker image with your ACR registry URL:
   ```bash
   docker tag your_image_name:tag your_acr_name.azurecr.io/your_image_name:tag
   ```

4. Push the image to your ACR:
   ```bash
   docker push your_acr_name.azurecr.io/your_image_name:tag
   ```

### 3. Kubernetes YAML file to deploy the static website:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: deployment_name
spec:
  replicas: 1
  selector:
    matchLabels:
      app: application_name
  template:
    metadata:
      labels:
        app: application_name
    spec:
      containers:
      - name: container_name
        image: your_acr_name.azurecr.io/your_image_name:tag
        ports:
        - containerPort: 80

---
apiVersion: v1
kind: Service
metadata:
  name: service_name
spec:
  selector:
    app: application_name
  ports:
    - protocol: TCP
      port: 80
      targetPort: 80
  type: LoadBalancer
```

Deploy to Kubernetes with the command:
```bash
kubectl apply -f deployment.yaml
```