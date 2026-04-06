import Link from "next/link";
import { getCheckoutProductsForRoute, getCheckoutRouteConfig } from "@/lib/checkoutProducts";
import { listStoredOrders } from "@/lib/orders";
import { buildOpsSummary, groupOrdersByDay, sortOrdersForOps } from "@/lib/parr/ops/grouping";
import { normalizeParrOrders } from "@/lib/parr/ops/normalize";
import type { OpsView } from "@/lib/parr/ops/types";
import OpsCalendarBoard from "./components/OpsCalendarBoard";
import OpsFilters from "./components/OpsFilters";
import OpsKpiBar from "./components/OpsKpiBar";
import OpsOrderDrawer from "./components/OpsOrderDrawer";
import OpsOrdersTable from "./components/OpsOrdersTable";
import OpsRunSheet from "./components/OpsRunSheet";
import OpsViewTabs from "./components/OpsViewTabs";

export const dynamic = "force-dynamic";

type SearchParams = {
  date?: string;
  view?: string;
  status?: string;
  payment?: string;
  route?: string;
  search?: string;
  order?: string;
  saved?: string;
  error?: string;
};

function normalizeView(value: string | undefined): OpsView {
  return value === "run-sheet" || value === "all-orders" ? value : "calendar";
}

function isDateParam(value: string | undefined) {
  return value === "all" || /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
}

export default async function ParrInventoryAdminPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const sp = (await searchParams) || {};
  const view = normalizeView(sp.view);
  const selectedStatus = String(sp.status || "all");
  const selectedPayment = String(sp.payment || "all");
  const selectedRoute = String(sp.route || "all");
  const search = String(sp.search || "").trim().toLowerCase();
  const selectedOrderId = String(sp.order || "").trim() || null;
  const saved = String(sp.saved || "").trim();
  const error = String(sp.error || "").trim();

  const allOrders = await listStoredOrders();
  const opsOrders = normalizeParrOrders(allOrders);
  const filteredOrders = opsOrders.filter((order) => {
    if (selectedStatus !== "all" && order.orderStatus !== selectedStatus) return false;
    if (selectedPayment !== "all" && order.paymentStatus !== selectedPayment) return false;
    if (selectedRoute !== "all" && order.route !== selectedRoute) return false;
    if (search && !order.searchText.includes(search)) return false;
    return true;
  });

  const dayGroups = groupOrdersByDay(filteredOrders);
  const selectedOrder = opsOrders.find((order) => order.orderId === selectedOrderId) || null;
  const knownDates = dayGroups.map((group) => group.date);
  const selectedDate =
    sp.date === "all"
      ? null
      : isDateParam(sp.date)
        ? String(sp.date)
        : knownDates.find((date) => date !== "unscheduled") || knownDates[0] || null;

  const scopedDayGroups =
    selectedDate && view !== "all-orders" ? dayGroups.filter((group) => group.date === selectedDate) : dayGroups;
  const scopedOrders =
    selectedDate && view !== "all-orders"
      ? filteredOrders.filter((order) => order.serviceDate === selectedDate)
      : filteredOrders;
  const summary = buildOpsSummary(scopedOrders);

  const baseParams = new URLSearchParams();
  if (selectedStatus !== "all") baseParams.set("status", selectedStatus);
  if (selectedPayment !== "all") baseParams.set("payment", selectedPayment);
  if (selectedRoute !== "all") baseParams.set("route", selectedRoute);
  if (search) baseParams.set("search", search);
  if (selectedDate) baseParams.set("date", selectedDate);
  const closeParams = new URLSearchParams(baseParams);
  closeParams.set("view", view);
  const closeHref = `/admin/parr-inventory?${closeParams.toString()}`;
  const nextParams = new URLSearchParams(baseParams);
  nextParams.set("view", view);
  if (selectedOrderId) nextParams.set("order", selectedOrderId);
  const nextPath = `/admin/parr-inventory?${nextParams.toString()}`;
  const selectedRouteConfig = selectedOrder ? getCheckoutRouteConfig(selectedOrder.route as "parr-private" | "parr-shared") : null;
  const selectedProductOptions = selectedOrder ? getCheckoutProductsForRoute(selectedOrder.route) : [];
  const selectedPickupOptions = selectedRouteConfig?.pickupOptions || [];
  const routeAllowsFreeformPickup = selectedRouteConfig?.pickupMode === "freeform";

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-orange-300">Internal</div>
            <h1 className="mt-2 text-4xl font-black tracking-tight">PARR Ops Console</h1>
            <p className="mt-2 text-zinc-300">
              Calendar-first Party at Red Rocks operations board with departure grouping and raw order fallback.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/satellite-handoffs?satellite=partyatredrocks"
              className="inline-flex items-center rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
            >
              PARR handoffs
            </Link>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4">
          {saved ? (
            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              Saved: {saved.replaceAll("_", " ")}.
            </div>
          ) : null}
          {error ? (
            <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error.replaceAll("_", " ")}
            </div>
          ) : null}
          <OpsViewTabs activeView={view} baseParams={baseParams} />
          <OpsFilters
            view={view}
            status={selectedStatus}
            payment={selectedPayment}
            route={selectedRoute}
            search={search}
            date={selectedDate || ""}
          />
          <OpsKpiBar summary={summary} />
        </div>

        <div className={`mt-6 grid gap-6 ${selectedOrder ? "xl:grid-cols-[minmax(0,1fr)_380px]" : ""}`}>
          <div className="min-w-0">
            {view === "calendar" ? (
              <OpsCalendarBoard
                days={dayGroups}
                selectedDate={selectedDate}
                baseParams={baseParams}
                selectedOrderId={selectedOrderId}
              />
            ) : null}

            {view === "run-sheet" ? (
              <OpsRunSheet
                days={scopedDayGroups}
                baseParams={baseParams}
                selectedOrderId={selectedOrderId}
              />
            ) : null}

            {view === "all-orders" ? (
              <OpsOrdersTable
                orders={sortOrdersForOps(filteredOrders)}
                baseParams={baseParams}
                selectedOrderId={selectedOrderId}
              />
            ) : null}
          </div>

          {selectedOrder ? (
            <OpsOrderDrawer
              order={selectedOrder}
              nextPath={nextPath}
              closeHref={closeHref}
              productOptions={selectedProductOptions}
              pickupOptions={selectedPickupOptions}
              routeAllowsFreeformPickup={routeAllowsFreeformPickup}
            />
          ) : null}
        </div>
      </div>
    </main>
  );
}
