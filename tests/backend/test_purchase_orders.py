"""
Tests for the purchase order endpoints.
"""
from datetime import date

import pytest

import main


@pytest.fixture(autouse=True)
def restore_purchase_orders():
    """Purchase orders are module-level state; isolate each test."""
    original = list(main.purchase_orders)
    main.purchase_orders.clear()
    yield
    main.purchase_orders[:] = original


def first_backlog_id():
    return main.backlog_items[0]["id"]


def create(client, **overrides):
    payload = {
        "backlog_item_id": first_backlog_id(),
        "supplier_name": "Acme Components",
        "quantity": 350,
        "unit_cost": 12.5,
        "expected_delivery_date": "2025-12-15",
        "notes": "Expedite",
        **overrides,
    }
    return client.post("/api/purchase-orders", json=payload)


class TestCreatePurchaseOrder:
    def test_create(self, client):
        response = create(client)
        assert response.status_code == 201
        po = response.json()
        assert po["id"] == "PO-0001"
        assert po["backlog_item_id"] == first_backlog_id()
        assert po["supplier_name"] == "Acme Components"
        assert po["quantity"] == 350
        assert po["unit_cost"] == 12.5
        assert po["expected_delivery_date"] == "2025-12-15"
        assert po["status"] == "pending"
        assert po["created_date"] == date.today().isoformat()
        assert po["notes"] == "Expedite"

    def test_notes_optional(self, client):
        response = create(client, notes=None)
        assert response.status_code == 201
        assert response.json()["notes"] is None

    def test_unknown_backlog_item_returns_404(self, client):
        response = create(client, backlog_item_id="does-not-exist")
        assert response.status_code == 404
        assert "does-not-exist" in response.json()["detail"]

    def test_second_po_for_same_item_returns_409(self, client):
        assert create(client).status_code == 201
        assert create(client).status_code == 409

    @pytest.mark.parametrize("overrides", [
        {"supplier_name": ""},
        {"quantity": 0},
        {"quantity": -5},
        {"unit_cost": 0},
        {"expected_delivery_date": "not-a-date"},
    ])
    def test_invalid_input_returns_422(self, client, overrides):
        assert create(client, **overrides).status_code == 422


class TestGetPurchaseOrder:
    def test_get_by_backlog_item(self, client):
        created = create(client).json()
        response = client.get(f"/api/purchase-orders/{first_backlog_id()}")
        assert response.status_code == 200
        assert response.json() == created

    def test_missing_returns_404(self, client):
        response = client.get(f"/api/purchase-orders/{first_backlog_id()}")
        assert response.status_code == 404


class TestBacklogPurchaseOrderStatus:
    def test_backlog_reports_po_status(self, client):
        before = {b["id"]: b for b in client.get("/api/backlog").json()}
        assert before[first_backlog_id()]["purchase_order_id"] is None
        assert before[first_backlog_id()]["has_purchase_order"] is False

        po_id = create(client).json()["id"]

        after = {b["id"]: b for b in client.get("/api/backlog").json()}
        assert after[first_backlog_id()]["purchase_order_id"] == po_id
        assert after[first_backlog_id()]["has_purchase_order"] is True
