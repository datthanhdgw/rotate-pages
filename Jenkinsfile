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
