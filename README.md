<p align="center">
    <img src="./public/app/logo_favicon.png" width="100" />
    <h1 align="center">Calendula</h1>
</p>

## 🗓️ Overview
Calendula is a service for managing meetings and tasks within a company.
You can invite colleagues to participate in the implementation of your tasks and discuss them.
All participants will be notified of the upcoming event.


## 🌈 Creative features
* User
	* View user's personal data
* Calendar
	* Grouping calendars into team and system calendars
	* Calendar 'Birthdays' of company employees
	* Unsubscribing from the calendar via the ‘Unsubscribe’ button
	* Calendar owner's mark
	* Search for users to participate by full name or email
  	* Searchable drop-down list of users to participate in
* Event
	* Preview of the event type in the title
	* Displaying the attendance status of participants
	* Drag and drop to change the date or time of event
	* Resize to change the event duration
	* Event owner's mark
	* Search for users to participate by full name or email
  	* Searchable drop-down list of users to participate in
   	* 'All day' event duration
	* Categories: 'work', 'home', 'hobby'
	* Notifications before: '10 min', '30 min', '1 h', '1 d' 
	* Attendance statuses: 'yes', 'no', 'maybe'
   	* Changing the event design depending on the user's attendance status
* Home page
	* Jump to today via the 'Today' button
	* Search for events by title and description
	* View events by month, weeek, day
	* Monthly calendar in the sidebar
	* Synchronise between the monthly calendar in the sidebar and main event view
	* Show the current day and time on the calendar


## 🤖 Technologies
<p align="center">
	<img src="https://img.shields.io/badge/Node.js-339933.svg?style=flat&logo=Node.js&logoColor=white" alt="Node.js">
	<img src="https://img.shields.io/badge/Express-000000.svg?style=flat&logo=Express&logoColor=white" alt="Express">
	<img src="https://img.shields.io/badge/MySQL-4479A1.svg?style=flat&logo=MySQL&logoColor=white" alt="MySQL">
	<img src="https://img.shields.io/badge/Playwright-45BA4B.svg?style=flat&logo=Playwright&logoColor=white" alt="Playwright">
	<img src="https://img.shields.io/badge/Nodemon-76D04B.svg?style=flat&logo=Nodemon&logoColor=white" alt="Nodemon">
	<img src="https://img.shields.io/badge/JSON_Web_Token-000000.svg?style=flat&logo=JSON-Web-Token&logoColor=white" alt="JSON Web Token">
	<img src="https://img.shields.io/badge/Argon2-5A29E4.svg?style=flat" alt="Argon2">
	<img src="https://img.shields.io/badge/Date_fns-FF5733.svg?style=flat" alt="Date-fns">
	<img src="https://img.shields.io/badge/Nodemailer-0095FF.svg?style=flat&logo=Nodemailer&logoColor=white" alt="Nodemailer">
	<img src="https://img.shields.io/badge/Swagger-85EA2D.svg?style=flat&logo=Swagger&logoColor=white" alt="Swagger">
</p>


## ⚙️ Requirements and Dependencies
Before starting, ensure the required technologies are installed.
- **Node.JS** >= v22
- **NPM** >= v10
- **MySQL** >= 8.0


## 🚀 How to Run the Solution
1. Clone this repository and move to the project directory.
   ```bash
   git clone <repository-url>
   ```
2. Install the dependencies.
   ```bash
   npm install
   ```
3. Configure the database connection by copying [.env.development.example](.env.development.example) to new file `.env.development`. After that put your MySQL credentials.  Example:
   ```
   DATABASE_HOST=localhost
   DATABASE_PORT=3306
   DATABASE_USER=root
   DATABASE_PASSWORD=root
   ```
   For test purposes you need to use `test` env. For this create `.env.test` based on the `.env.test.example` file.
4. Configure the migrations config by copying [migration_config.json.example](db/migration_config.json.example) to new file `db/migration_config.json`. After that put your MySQL credentials to `dev` part. ☝️ Don't add part about "database".
   ```json
   {
       "dev": {
          "driver": "mysql",
          "user": "root",
          "password": "root",
          "port": 3306,
          "multipleStatements": true
     }
   }
   ```
5. Run migration for create database `Calendula`.
   ```shell
   npm run migrate:db:create:dev -- Calendula
   ```
   > If you get the error _“ifError got unwanted exception: Unknown database 'Calendula'”_, then delete the ‘database’ field in the configuration file `db/migration_config.json`. Then run the command again.
6. Add the “database” field to `db/migration_config.json`. The `dev` environment configuration may look like this:
   ```json
   {
       "dev": {
          "driver": "mysql",
          "user": "root",
          "password": "root",
          "port": 3306,
          "multipleStatements": true,
          "database": "Calendula"
     }
   }
   ```
7. Run migration for create tables in your database.
   ```shell
   npm run migrate:up:dev
   ```
   If you encounter problems, try the command that will delete all tables and create them again.
   ```shell
   npm run migrate:refresh:dev
   ```
8. Start the server.
   ```bash
   npm run start:dev
   ```
9. In new console you can run task scheduler. It's not necessary.
   ```bash
   npm run scheduler:<env>
   ```


## 📊 Deployment Diagram
![deployment_diagram.png](docs/deployment_diagram.png)


## 🐋 Docker
Environment variables are taken from `.env.development` file. You can start containers with the command:
   ```bash
   docker-compose --env-file .env.development up -d
   ```


## 📦 Database Migration
Migrations are possible on such environments: `dev`, `test`, and `prod`.

Environment settings are loaded from a `./db/migration_config.json` file. Create your `./db/migration_config.json` file and add the properties for the environments to it. To do this, copy `./db/migration_config.json.example` or to `./db/migration_config.json`. Then edit `./db/migration_config.json` if necessary (e.g. add a test database).

Note that migrations are only possible on **existing databases**. Therefore, create your database first. Example of a database creation query to be executed in the database console:
```sql
DROP DATABASE IF EXISTS Calendula;
CREATE DATABASE Calendula;
USE Calendula;
```
or
```sql
DROP DATABASE IF EXISTS Calendula_Test;
CREATE DATABASE Calendula_Test;
USE Calendula_Test;
```
Or use commands:
```bash
migrate:db:drop:<env> && migrate:db:create:<env>
```
In the examples of all commands in the text `<env>` is the name of the environment to perform the migration, e.g. `dev`, `test` or `prod`.

**To create tables in the database, execute the command:**
```bash
npm run migrate:up:<env>
```
To update the tables in the database, run the following command:
```bash
npm run migrate:refresh:<env>
```
Full list of commands:
1. The `create` command creates a migration that loads sql file with the name `<migration-name>` in configured migrations directory `./db/migrations`.
   ```bash
   npm run migrate:create:<env> -- <migration-name>
   ```
Where `<migration-name>` is the name of the migration you are creating, e.g., `update-events-categories`.
2. The `up` command executes the migrations of your currently configured migrations directory. More specific the `up` migrations are being called.
   ```bash
   npm run migrate:up:<env>
   ```
3. The `down` command executes the migrations of your currently configured migrations directory. More specific the `down` migrations are being called.
   ```bash
   npm run migrate:down:<env>
   ```
4. The `reset` command is a shortcut to execute all down migrations and literally reset all migrations which where currently done. The `reset` command also executes by default only the first scope.
   ```bash
   npm run migrate:reset:<env>
   ```
5. To perform `reset` and `up`, run the following command:
   ```bash
   npm run migrate:refresh:<env>
   ```
6. For create database try this command with {DATABASE_NAME}:
   ```bash
   npm run migrate:db:create:<env> -- {DATABASE_NAME}
   ```
7. For delete database try this command with {DATABASE_NAME}:
   ```bash
   npm run migrate:db:drop:<env> -- {DATABASE_NAME}
   ```

Answers to other questions can be found in the official [db-migrate](https://db-migrate.readthedocs.io/en/latest/) documentation.


## ⏰ Task Scheduler
Our service can process tasks in the background. Currently, we use it to send email notifications about upcoming events.
Scheduler is available on such environments: `dev`, `test`, and `prod`.
To start the service, you need to run the command.
   ```bash
   npm run scheduler:<env>
   ```


## 📫 Mailing Service
[Ethereal](https://ethereal.email/) is a fake SMTP service, mostly aimed at Nodemailer and EmailEngine users (but not limited to). It's a completely free anti-transactional email service where messages never get delivered.
To view the letter that the user will receive, you need to log in to this service using a test login and password. Default credentials you can find in [.env.development.example](.env.development.example)

![ethereal.png](docs/ethereal.png)


## 🔁 REST API documentation
The documentation of all available endpoints can be found [http://localhost:8080/api-docs/](http://localhost:8080/api-docs/). The [Swagger](https://swagger.io/) library is used.

![swagger.png](docs/swagger_.png)


## 🪲 API Testing
Create an `.env.test` file and add the variables for the test environment to it. To do this, copy `.env.test.example` or to `.env.test`. Then edit `.env.test` if necessary (e.g. add a test database).

In the examples of all commands below in the text `<env>` is the name of the environment to perform the command, e.g. `dev`, `test` or `prod`.

Start the server with the command:
```bash
npm run start:<env>
```
Once the dependencies are installed and the backend is running, you can run the tests. To do this, use the command:
Running all tests:
```bash
npm run test:api:<env>
```
Run all tests and create a report on the results:
```bash
npm run test:api:report:<env>
```
Run tests for a specific component:
```bash
ENV=<env> npx playwright test tests/api/<file_name>.test.js --debug
```


## 👤 Fake Data
In the examples of all commands below in the text `<env>` is the name of the environment to perform the command, e.g. `dev`, `test` or `prod`.

To fill the database with demo data of users, calendars and events, run the command:
```bash
npm run test:seed:<env>
```
Here is the fake data for presentations. 

User data for testing:
* full name:
   ```text
   Test User
   ```
* email:
  ```text
  test.user@calendula.ua
  ```
All users have a password:
```text
Password123!$
```
