
import { GoogleGenAI, Type } from "@google/genai";
import { OrderData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateOrderNotification = async (order: OrderData): Promise<string> => {
  try {
    const itemsList = order.cart.map(item => `${item.quantity}x ${item.product.name} (${item.selectedSize})`).join(', ');
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a professional, minimalist order notification summary for the shop owner. 
      Customer: ${order.customerName}
      Phone: ${order.phone}
      Address: ${order.address}
      Items: ${itemsList}
      Total: ₪${order.total}
      Payment Method: BIT
      Keep it brief and clean.`,
    });

    return response.text || "New Order Received.";
  } catch (error) {
    console.error("Gemini Notification Error:", error);
    return "New Order Notification Error. Check dashboard.";
  }
};
