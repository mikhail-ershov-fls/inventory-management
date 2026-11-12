"""
Tests for the restocking order endpoints and the forecast pricing they rely on.
"""
from datetime import date, timedelta

import pytest

import main


@pytest.fixture(autouse=True)
def restore_restock_orders():
    """Restock orders are module-level state; isolate each test."""
    original = list(main.restock_orders)
    main.restock_orders.clear()
    yield
    main.restock_orders[:] = original


def forecast(sku):
    return next(f for f in main.demand_forecasts if f["item_sku"] == sku)


class TestDemandForecastPricing:
    def test_every_forecast_has_cost_and_lead_time(self, client):
        response = client.get("/api/demand")
        assert response.status_code == 200
        for item in response.json():
            assert item["unit_cost"] > 0
            assert item["lead_time_days"] > 0


class TestCreateRestockOrder:
    def test_create_prices_lines_from_forecast_data(self, client):
        response = client.post("/api/restock-orders", json={
            "budget": 5000,
            "items": [{"sku": "WDG-001", "quantity": 10}, {"sku": "GSK-203", "quantity": 4}],
        })
        assert response.status_code == 201
        order = response.json()

        wdg, gsk = forecast("WDG-001"), forecast("GSK-203")
        assert order["id"] == "RO-0001"
        assert order["status"] == "Submitted"
        assert order["items"][0]["unit_cost"] == wdg["unit_cost"]
        assert order["items"][0]["name"] == wdg["item_name"]
        assert order["total_cost"] == round(10 * wdg["unit_cost"] + 4 * gsk["unit_cost"], 2)
        assert order["budget"] == 5000

    def test_lead_time_is_slowest_item(self, client):
        response = client.post("/api/restock-orders", json={
            "items": [{"sku": "FLT-405", "quantity": 1}, {"sku": "MTR-304", "quantity": 1}],
        })
        order = response.json()
        expected = max(forecast("FLT-405")["lead_time_days"], forecast("MTR-304")["lead_time_days"])
        assert order["lead_time_days"] == expected
        assert order["order_date"] == date.today().isoformat()
        assert order["expected_delivery_date"] == (date.today() + timedelta(days=expected)).isoformat()

    def test_over_budget_is_rejected(self, client):
        response = client.post("/api/restock-orders", json={
            "budget": 10,
            "items": [{"sku": "MTR-304", "quantity": 1}],
        })
        assert response.status_code == 400
        assert main.restock_orders == []

    def test_unknown_sku_is_rejected(self, client):
        response = client.post("/api/restock-orders", json={"items": [{"sku": "NOPE-1", "quantity": 1}]})
        assert response.status_code == 404

    def test_duplicate_sku_is_rejected(self, client):
        response = client.post("/api/restock-orders", json={
            "items": [{"sku": "WDG-001", "quantity": 1}, {"sku": "WDG-001", "quantity": 2}],
        })
        assert response.status_code == 400

    @pytest.mark.parametrize("payload", [
        {"items": []},
        {"items": [{"sku": "WDG-001", "quantity": 0}]},
        {"budget": -1, "items": [{"sku": "WDG-001", "quantity": 1}]},
    ])
    def test_invalid_payload_is_rejected(self, client, payload):
        assert client.post("/api/restock-orders", json=payload).status_code == 422


class TestListRestockOrders:
    def test_empty_by_default(self, client):
        response = client.get("/api/restock-orders")
        assert response.status_code == 200
        assert response.json() == []

    def test_newest_first(self, client):
        for sku in ("WDG-001", "GSK-203"):
            client.post("/api/restock-orders", json={"items": [{"sku": sku, "quantity": 1}]})
        ids = [o["id"] for o in client.get("/api/restock-orders").json()]
        assert ids == ["RO-0002", "RO-0001"]
