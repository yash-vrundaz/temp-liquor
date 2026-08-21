"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DeliveryAddress, DeliveryStatus, Driver, Order } from "@/types";
import { drivers as seedDrivers } from "@/data/drivers";

type DeliveryState = {
  drivers: Driver[];
  byOrder: Record<
    string,
    { driverId?: string; status: DeliveryStatus; delivery?: DeliveryAddress }
  >;
  attach: (orderId: string, delivery: DeliveryAddress) => void;
  assign: (orderId: string, driverId: string) => void;
  setStatus: (orderId: string, status: DeliveryStatus) => void;
  enrich: (order: Order) => Order;
};

export const useDeliveryStore = create<DeliveryState>()(
  persist(
    (set, get) => ({
      drivers: seedDrivers,
      byOrder: {},
      attach: (orderId, delivery) =>
        set((s) => ({
          byOrder: {
            ...s.byOrder,
            [orderId]: { ...s.byOrder[orderId], status: "unassigned", delivery },
          },
        })),
      assign: (orderId, driverId) =>
        set((s) => ({
          byOrder: {
            ...s.byOrder,
            [orderId]: { ...s.byOrder[orderId], driverId, status: "assigned" },
          },
          drivers: s.drivers.map((driver) =>
            driver.id === driverId ? { ...driver, status: "on_route" } : driver,
          ),
        })),
      setStatus: (orderId, status) =>
        set((s) => {
          const current = s.byOrder[orderId];
          const driverId = current?.driverId;
          return {
            byOrder: {
              ...s.byOrder,
              [orderId]: { ...current, status },
            },
            drivers: s.drivers.map((driver) =>
              driver.id === driverId
                ? {
                    ...driver,
                    status: status === "delivered" || status === "unassigned" ? "available" : "on_route",
                  }
                : driver,
            ),
          };
        }),
      enrich: (order) => {
        const extra = get().byOrder[order.id];
        const driver = extra?.driverId
          ? get().drivers.find((item) => item.id === extra.driverId)
          : order.driver;
        return {
          ...order,
          delivery: extra?.delivery ?? order.delivery,
          deliveryStatus: extra?.status ?? order.deliveryStatus,
          driverId: extra?.driverId ?? order.driverId,
          driver,
        };
      },
    }),
    { name: "sams-delivery" },
  ),
);
