# Todo-List-WebApp

A simple task manager progressive web app made in angular and asp.net core 6

## Features
- Token based authentication(JWT)
- Reactive Task List
- Online and offline support


Live Demo: https://flame-todo-list.web.app

## Setup

#### Server:

Change MySQL connectionstring and JWT settings in server/appsettings.json.

Open package manager console and update the database using this command
```
Update-Database
```

Build docker image using server/Dockerfile.

Host to serverless platforms like Cloud Run, Amazon Lambda.


#### Client:

Initialize firebase with the following settings
```
firebase init
```

``` 
filename: firebase.json
{
  "hosting": {
    "public": "dist/client",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```
Deploy to firebase
```
firebase deploy
```
