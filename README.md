# videoSearch
Extract insights from video

A primitive version of a work in progress

To use, must use python 3 (may need to source the correct pip modules for python):
- Clone repo
- in the terminal, cd into the repo and:
    - Create env.sh with the following text:
        - export MONGODB_URI='xxxxxxxxxxxxx'  //mogodb_uri
        - export AWS_ACCESS_KEY_ID="xxxxxxxxxxx"  //aws s3 account access key id
        - export AWS_SECRET_ACCESS_KEY="xxxxxxxxxxxx"  //aws s3 account secret access key
        - export id='xxxxxxxxxxxxxxxxxxxxxxx'  //clarifai id
        - export password='xxxxxxxxxxxxxxxxxxx'  //clarifai password
    - npm install
    - npm run webpack
    - npm start
- in a separate terminal cd into backend/python and type the following commands:
    - pip install 
    - python testServery.py
- open localhost:3000 and use the whatever functionality you like
