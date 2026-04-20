pipeline {
    agent any 

    triggers {
        cron('H 0 * * *')
        pollSCM('* * * * *')
    }

    stages {
        stage('Step 1: Setup') {
            steps {
                echo 'Installing Dependencies...'
                bat 'npm install'
                bat 'npx playwright install --with-deps'
            }
        }

        stage('Step 2: Execution') {
            steps {
                script {
                    if (currentBuild.buildCauses.toString().contains('TimerTrigger')) {
                        echo 'Starting Full Nightly Regression...'
                        bat 'npx playwright test --grep @regression'
                    } 
                    else {
                        echo 'Starting Smoke Tests...'
                        bat 'npx playwright test --project=chromium --grep @smoke'
                    }
                }
            }
        }
    }

    post {
        always {
            echo 'Generating Reports...'
            publishHTML(target: [
                allowMissing: false,
                alwaysLinkToLastBuild: true,
                keepAll: true,
                reportDir: 'playwright-report',
                reportFiles: 'index.html',
                reportName: 'Playwright Test Report'
            ])
        }
    }
}