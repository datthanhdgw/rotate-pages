pipeline {
    agent any
    
    environment {
        DOCKER_IMAGE = 'datthanhdgw/rotate-pages'
        DOCKER_TAG = "${BUILD_NUMBER}"
        HELM_RELEASE_NAME = 'rotate-pages'
        HELM_CHART_PATH = 'helm'
        KUBERNETES_NAMESPACE = 'rotate-pages'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Build') {
            steps {
                script {
                    docker.build("${DOCKER_IMAGE}:${DOCKER_TAG}")
                    docker.tag("${DOCKER_IMAGE}:${DOCKER_TAG}", "${DOCKER_IMAGE}:latest")
                }
            }
        }
        
        stage('Push to DockerHub') {
            steps {
                script {
                    docker.withRegistry('https://registry.hub.docker.com', 'dockerhub-credentials') {
                        docker.image("${DOCKER_IMAGE}:${DOCKER_TAG}").push()
                        docker.image("${DOCKER_IMAGE}:latest").push()
                    }
                }
            }
        }
        
        stage('Deploy to Kubernetes') {
            steps {
                script {
                    // Update Helm values with new image tag
                    sh """
                        sed -i 's|tag: .*|tag: ${DOCKER_TAG}|' ${HELM_CHART_PATH}/values.yaml
                    """
                    
                    // Deploy using Helm
                    sh """
                        helm upgrade --install ${HELM_RELEASE_NAME} ${HELM_CHART_PATH} \
                            --namespace ${KUBERNETES_NAMESPACE} \
                            --create-namespace \
                            --set image.tag=${DOCKER_TAG}
                    """
                }
            }
        }
        
        stage('Verify Deployment') {
            steps {
                script {
                    // Wait for deployment to be ready
                    sh """
                        kubectl rollout status deployment/${HELM_RELEASE_NAME} \
                            -n ${KUBERNETES_NAMESPACE} \
                            --timeout=300s
                    """
                    
                    // Check if service is accessible
                    sh """
                        kubectl get service ${HELM_RELEASE_NAME} \
                            -n ${KUBERNETES_NAMESPACE} \
                            -o jsonpath='{.spec.ports[0].nodePort}'
                    """
                }
            }
        }
    }
    
    post {
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed!'
        }
    }
} 