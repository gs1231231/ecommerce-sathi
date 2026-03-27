import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { PinoLogger } from "nestjs-pino";

@WebSocketGateway({
  cors: { origin: "*" },
  namespace: "/events",
})
export class EventsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private connectedClients = new Map<string, string>(); // socketId -> tenantId

  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext("EventsGateway");
  }

  handleConnection(client: Socket): void {
    const tenantId = client.handshake.query.tenantId as string;
    if (tenantId) {
      this.connectedClients.set(client.id, tenantId);
      client.join(`tenant:${tenantId}`);
      this.logger.info(
        { clientId: client.id, tenantId },
        "Client connected",
      );
    }
  }

  handleDisconnect(client: Socket): void {
    this.connectedClients.delete(client.id);
    this.logger.info({ clientId: client.id }, "Client disconnected");
  }

  // Emit events to all clients of a tenant
  emitToTenant(tenantId: string, event: string, data: unknown): void {
    this.server.to(`tenant:${tenantId}`).emit(event, data);
  }

  // Event methods for other services to call
  notifyNewOrder(
    tenantId: string,
    order: { id: string; orderNumber: number; grandTotal: string; customerName: string },
  ): void {
    this.emitToTenant(tenantId, "order:created", {
      type: "NEW_ORDER",
      message: `New order #${order.orderNumber} from ${order.customerName} - Rs.${order.grandTotal}`,
      data: order,
      timestamp: new Date().toISOString(),
    });
  }

  notifyPaymentReceived(
    tenantId: string,
    payment: { orderId: string; amount: string; method: string },
  ): void {
    this.emitToTenant(tenantId, "payment:received", {
      type: "PAYMENT_RECEIVED",
      message: `Payment of Rs.${payment.amount} received via ${payment.method}`,
      data: payment,
      timestamp: new Date().toISOString(),
    });
  }

  notifyInventoryLow(
    tenantId: string,
    product: { title: string; sku: string; quantity: number },
  ): void {
    this.emitToTenant(tenantId, "inventory:low", {
      type: "LOW_INVENTORY",
      message: `Low stock: ${product.title} (${product.sku}) - only ${product.quantity} left`,
      data: product,
      timestamp: new Date().toISOString(),
    });
  }
}
