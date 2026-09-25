import { getChannel } from "../../../config/rabbitmq";
import IUser from "../../../interfaces/IUser";
import { context } from "../../../utils/context";

export const sendUserData = async (exchange: string, data: Partial<IUser>) => {
  try {
    const channel = getChannel();
    await channel.assertExchange(exchange, "fanout", { durable: true });
    
    const correlationId = context.getStore()?.get('correlationId');
    channel.publish(exchange, "", Buffer.from(JSON.stringify(data)), {
       headers: { correlationId }
    });
    console.log("user data sent to exchange:", data);
  } catch (error) {
    console.error("Failed to send user data", error);
  }
};
