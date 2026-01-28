# Lab 0

This lab introduces you to the technology you'll use throughout this course.

## Stack

This application's software stack consists of:
- [Kubernetes](https://kubernetes.io/), a container orchestration platform.
- [Postgres](https://www.postgresql.org/), an open-source SQL database.
- [next.js](https://nextjs.org/), an advanced, React-based Web framework.

### Kubernetes

Kubernetes is a tool that manages containers that run in a cluster.
Containers are a standardized, light-weight, portable software package. 
They are often deployed in a cluster, which is a group of servers working together.
Clusters are difficult to manage because they can contain hundreds, or even thousands, of machines.
To reduce this difficulty, Kubernetes was released in 2014.

## Software Packages

- Download Docker Desktop [here](https://www.docker.com/products/docker-desktop/). 
	- After installation, open the Docker Dashboard application, navigate to the Settings view by clicking on the gear icon, then click on the "Kubernetes" menu item in the left scroll pane. In the Kubernetes view, ensure that "Enable Kubernetes" is selected.
		- To validate your installation, run the following command:
```
❯ docker run hello-world

Hello from Docker!
This message shows that your installation appears to be working correctly.

To generate this message, Docker took the following steps:
 1. The Docker client contacted the Docker daemon.
 2. The Docker daemon pulled the "hello-world" image from the Docker Hub.
    (arm64v8)
 3. The Docker daemon created a new container from that image which runs the
    executable that produces the output you are currently reading.
 4. The Docker daemon streamed that output to the Docker client, which sent it
    to your terminal.

To try something more ambitious, you can run an Ubuntu container with:
 $ docker run -it ubuntu bash

Share images, automate workflows, and more with a free Docker ID:
 https://hub.docker.com/

For more examples and ideas, visit:
 https://docs.docker.com/get-started/
```

- Install Helm by following the instructions on [its web page](https://helm.sh/docs/intro/install). 
	- Validate your installation by running the following command:
```
❯ helm help
The Kubernetes package manager

Common actions for Helm:

- helm search:    search for charts
- helm pull:      download a chart to your local directory to view
- helm install:   upload the chart to Kubernetes
- helm list:      list releases of charts
...
```

## Running Software

### Development Configuration

Now, attempt to run the demo software. To run the software, navigate in your terminal to the directory where the lab software is downloaded. For example:
```
❯ cd ~/Downloads/lab-0/
```

Then, you'll execute this command:
```
❯ docker image build -t my-app:dev ./ -f Dockerfile.dev
[+] Building 39.5s (9/9) FINISHED                                                                                                                                                                                           docker:desktop-l
 => [internal] load build definition from Dockerfile.dev                                                                                                                                                                                    
 => => transferring dockerfile: 148B                                                                                                                                                                                                        
 => [internal] load metadata for docker.io/library/node:22-alpine                                                                                                                                                                           
 => [internal] load .dockerignore                                                                                                                                                                                                           
 => => transferring context: 2B                                                                                                                                                                                                             
 => [1/4] FROM docker.io/library/node:22-alpine@sha256:0340fa682d72068edf603c305bfbc10e23219fb0e40df58d9ea4d6f33a9798bf                                                                                                                     
 => => resolve docker.io/library/node:22-alpine@sha256:0340fa682d72068edf603c305bfbc10e23219fb0e40df58d9ea4d6f33a9798bf                                                                                                                     
 => [internal] load build context                                                                                                                                                                                                           
 => => transferring context: 19.05MB                                                                                                                                                                                                        
 => CACHED [2/4] WORKDIR /app                                                                                                                                                                                                               
 => [3/4] COPY . .                                                                                                                                                                                                                          
 => [4/4] RUN npm ci                                                                                                                                                                                                                       1
 => exporting to image                                                                                                                                                                                                                     1 => => exporting layers                                                                                                                                                                                                                    1 => => exporting manifest sha256:c8b3c761340d419e0b5d8a01bf28446342a030612f4027481748ac334785ee38                                                                                                                                           
 => => exporting config sha256:a5b90f5f8969fecaa9732827ef2021b8bc09c2d6e4e66404c7f5c15c3c089b35                                                                                                                                             
 => => exporting attestation manifest sha256:bfb9e51c80890e876e7f29bd146dc96f9e185af08aff41df20602faf50e29c48                                                                                                                               
 => => exporting manifest list sha256:7f6b85d711e76556c27b6157185b1f66f9a54e224f3eb1080d7d821a919bba4b                                                                                                                                      
 => => naming to docker.io/library/my-app:dev                                                                                                                                                                                               
 => => unpacking to docker.io/library/my-app:dev                                                                                                                                                                                            
```

Next, you'll need to make a directory to store application data. Note that you only need to do this step ONCE:
```
❯ mkdir data
```

Finally, you'll use helm to deploy the application:
```
❯ helm install my-app-workflow my-app-workflow --set "sourceCode.path=$(pwd)/app" --set "db.path=$(pwd)/data"
NAME: my-app-workflow
LAST DEPLOYED: Tue Dec 30 09:57:36 2025
NAMESPACE: default
STATUS: deployed
REVISION: 1
DESCRIPTION: Install complete
NOTES:
1. Get the application URL by running these commands:
     NOTE: It may take a few minutes for the LoadBalancer IP to be available.
           You can watch its status by running 'kubectl get --namespace default svc -w my-app-workflow'
  export SERVICE_IP=$(kubectl get svc --namespace default my-app-workflow --template "{{ range (index .status.loadBalancer.ingress 0) }}{{.}}{{ end }}")
  echo http://$SERVICE_IP:80
```

Navigate to [http://localhost](http://localhost). You'll see the web page.

Note that you can edit the web page source code files and you'll have hot reloads.

### "Production" Configuration

Please deploy the development configuration first.

First, remove the development deployment using this command:
```
❯ helm uninstall my-app-workflow
release "my-app-workflow" uninstalled
```

Then, build a production Docker image:
```
❯ docker image build -t my-app ./
[+] Building 16.6s (14/14) FINISHED                                                                                                                                                                                         docker:desktop-l
 => [internal] load build definition from Dockerfile                                                                                                                                                                                        
 => => transferring dockerfile: 389B                                                                                                                                                                                                        
 => [internal] load metadata for docker.io/library/node:22-alpine                                                                                                                                                                           
 => [internal] load .dockerignore                                                                                                                                                                                                           
 => => transferring context: 2B                                                                                                                                                                                                             
 => [internal] load build context                                                                                                                                                                                                           
 => => transferring context: 1.82MB                                                                                                                                                                                                         
 => [builder 1/6] FROM docker.io/library/node:22-alpine@sha256:0340fa682d72068edf603c305bfbc10e23219fb0e40df58d9ea4d6f33a9798bf                                                                                                             
 => => resolve docker.io/library/node:22-alpine@sha256:0340fa682d72068edf603c305bfbc10e23219fb0e40df58d9ea4d6f33a9798bf                                                                                                                     
 => CACHED [builder 2/6] WORKDIR /app                                                                                                                                                                                                       
 => CACHED [builder 3/6] COPY package*.json ./                                                                                                                                                                                              
 => CACHED [builder 4/6] RUN npm ci                                                                                                                                                                                                         
 => [builder 5/6] COPY . .                                                                                                                                                                                                                  
 => [builder 6/6] RUN npm run build                                                                                                                                                                                                        1
 => [runner 3/5] COPY --from=builder /app/.next/standalone ./                                                                                                                                                                               
 => [runner 4/5] COPY --from=builder /app/.next/static ./.next/static                                                                                                                                                                       
 => [runner 5/5] COPY --from=builder /app/public ./public                                                                                                                                                                                   
 => exporting to image                                                                                                                                                                                                                      
 => => exporting layers                                                                                                                                                                                                                     
 => => exporting manifest sha256:700ab80e88c7f3a45ae00761f7de6b100104b47e2cf272ebc0465c04b247c4ec                                                                                                                                           
 => => exporting config sha256:1bf34e037060bc4fd27d183455b9766e760583ebff1461146f4304aa5162a375                                                                                                                                             
 => => exporting attestation manifest sha256:541c44fc61d18610e9858ec8245489ce2ed1ce0baf2112779fffb29529aff40e                                                                                                                               
 => => exporting manifest list sha256:a779900e63768268197d2893bd0d6a5819bf639d17a101920cf0939116cc50c4                                                                                                                                      
 => => naming to docker.io/library/my-app:latest                                                                                                                                                                                            
 => => unpacking to docker.io/library/my-app:latest                                                                                                                                                                                         
```

Finally, deploy the application:
```
❯ helm install my-app-workflow my-app-workflow --set "sourceCode.path=$(pwd)/app" --set "db.path=$(pwd)/data" --set "app.tag=latest"
NAME: my-app-workflow
LAST DEPLOYED: Tue Dec 30 10:04:54 2025
NAMESPACE: default
STATUS: deployed
REVISION: 1
DESCRIPTION: Install complete
NOTES:
1. Get the application URL by running these commands:
     NOTE: It may take a few minutes for the LoadBalancer IP to be available.
           You can watch its status by running 'kubectl get --namespace default svc -w my-app-workflow'
  export SERVICE_IP=$(kubectl get svc --namespace default my-app-workflow --template "{{ range (index .status.loadBalancer.ingress 0) }}{{.}}{{ end }}")
  echo http://$SERVICE_IP:80
```

Note that the difference between this command and the `helm` command that you ran in the Development workflow is that we have overriden 
the `app.tag` value. Overriding this value causes Kubernetes to use the production Docker image that you just created.
