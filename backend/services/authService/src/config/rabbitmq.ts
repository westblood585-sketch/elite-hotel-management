import amqplib, { Connection, Channel } from "amqplib";

let connection: Connection;
let channel: Channel;

const RABBITMQ_URL = process.env.RABBITMQ_URL || "";

export const rabbitmqConnect = async () => {
  while (true) {
    try {
      connection = await amqplib.connect(RABBITMQ_URL);
      channel = await connection.createChannel();
      
      // Ensure exchanges
      await channel.assertExchange('user.events', 'topic', { durable: true });
      await channel.assertExchange('user.events.dlx', 'topic', { durable: true });

      // Auth service specific queues? 
      // It likely consumes user events for cache sync.
      
      console.log("Connected to RabbitMQ in authService");
      break;
    } catch (error) {
      console.error("Failed to connect to RabbitMQ", error);
      console.log("retrying connection in 5 seconds...");
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
};

export const getChannel = (): Channel => channel;
