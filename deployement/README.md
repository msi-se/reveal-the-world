RUN 
- az login
- terraform plan -out main.tfplan
- terraform apply main.tfplan
- echo "$(terraform output kube_config)" > ./azurek8s.yaml
- echo "$(terraform output connection_string)" > ./cosmos.txt
- deploy images to azure container registry
- use kubectl or helm to deploy the app