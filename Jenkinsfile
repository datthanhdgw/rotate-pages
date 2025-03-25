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
