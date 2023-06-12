import { Channel,ConsumeMessage } from "amqplib";
import config from "../config";
import { randomUUID } from "crypto";
import EventEmitter from "events";
import Consumer from "./consumer";

export default class Producer {
  constructor(
    private channel: Channel,
    private replyQueueName: string,
    private eventEmitter: EventEmitter,
    
  ) {}

  async produceMessages(data: any) {
    const uuid = randomUUID();
    let flag = true;
    

    console.log("the corr id is ", uuid);
    this.channel.sendToQueue(
      config.rabbitMQ.queues.rpcQueue,
      Buffer.from(data //JSON.stringify(data)
      ),
      {
        replyTo: this.replyQueueName,
        correlationId: uuid,
        expiration: 10,
        headers: {
          function: data.operation,
        },
      }
    );

    let timer =  setTimeout(() => {
      console.log("removed emmit")
      
      if (flag) {
        
        let reply : ConsumeMessage = {
          content : Buffer.from(JSON.stringify({"success": false, msg:"timeout error"})), 
          fields: null,
          properties: null
      }; 
        this.eventEmitter.emit(uuid, reply);      
        flag = false;
      }     
    }, 5000); 
    
    
    return new Promise((resolve, reject) => {
      this.eventEmitter.once(uuid, async (data) => {
        const reply1 = JSON.parse(data.content.toString());
        timer.unref();
        flag = false;
        resolve(reply1);
      });      
    });
  }
}
