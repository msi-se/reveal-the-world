# this script takes a service name as an argument and creates a new microservice
#   - express server
#   - mongoose / mongodb (get env variables from .env file)
#   - dockerfile

if [ -z "$1" ]
  then
    echo "No service name supplied"
    exit 1
fi

# create service folder
mkdir -p $1

# copy files from template except package.json
cp -r ./template/. $1
rm $1/package.json

# create package.json
text="{
  \"name\": \"test-service\",
  \"version\": \"1.0.0\",
  \"description\": \"\",
  \"main\": \"index.js\",
  \"scripts\": {
    \"start\": \"node index.js\"
  },
  \"keywords\": [],
  \"author\": \"\",
  \"license\": \"ISC\",
  \"dependencies\": {
    \"dotenv\": \"^16.3.1\",
    \"express\": \"^4.18.2\",
    \"mongoose\": \"^8.0.3\"
  },
  \"devDependencies\": {
    \"nodemon\": \"^3.0.2\"
  },
  \"type\": \"module\"
}"

echo "$text" > $1/package.json

# run npm install and start
cd $1
npm install
nodemon index.js

