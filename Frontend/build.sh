now=$(date +"%s")

docker image build -t llm_frontend:$now .

echo "\e[1;35m Build successfully \e[0m"