<h3>$ Use nvm 20</h3>
<p>$ nvm install 20.18.1</p>
<p> nvm use 20.18.1</p>

<p>To start the scraper type in terminal : pm2 start server.js</p>
<p>https://pm2.keymetrics.io/docs/usage/quick-start/</p>

<h3>POST Request and Body Parameter<h3>
https://domain.com/scrape-employee
{
  "username": "",
  "password": "",
   "cvr" : ""
}
<br> <br> 

https://domain.com/scrape-cvr
{
  "username": "",
  "password": "",
   "company" : ""
}
<br> <br> 
https://domain.com/scrape-company
{
   "company" : ""
}
