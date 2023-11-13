import express, { Express, Request, Response } from 'express';
import path from 'path';

const app: Express = express();
const port = 7829;

function StartWebServer() {

  app.get('/', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '/public/index.html'));
  });
  
  app.listen(port, () => {
    console.log(`[STATS]: Web Server is running at http://127.0.0.1:${port}`);
  });

}

export default StartWebServer;