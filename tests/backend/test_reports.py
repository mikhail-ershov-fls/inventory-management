"""
Tests for the report endpoints and their filter support.
"""
from main import orders

QUARTERLY = "/api/reports/quarterly"
MONTHLY = "/api/reports/monthly-trends"


def _total(rows, key):
    return sum(r[key] for r in rows)


class TestReportFilters:
    def test_unfiltered_monthly_counts_all_orders(self, client):
        rows = client.get(MONTHLY).json()
        assert _total(rows, "order_count") == len([o for o in orders if o.get("order_date")])

    def test_month_filter_limits_monthly_trends(self, client):
        rows = client.get(MONTHLY, params={"month": "2025-01"}).json()
        assert [r["month"] for r in rows] == ["2025-01"]

    def test_month_filter_limits_quarterly(self, client):
        rows = client.get(QUARTERLY, params={"month": "2025-01"}).json()
        assert [r["quarter"] for r in rows] == ["Q1-2025"]

    def test_quarter_filter(self, client):
        rows = client.get(MONTHLY, params={"month": "Q2-2025"}).json()
        assert [r["month"] for r in rows] == ["2025-04", "2025-05", "2025-06"]

    def test_warehouse_filter(self, client):
        expected = [o for o in orders if o.get("warehouse") == "San Francisco"]
        assert expected, "fixture data should contain San Francisco orders"
        monthly = client.get(MONTHLY, params={"warehouse": "San Francisco"}).json()
        quarterly = client.get(QUARTERLY, params={"warehouse": "San Francisco"}).json()
        assert _total(monthly, "order_count") == len(expected)
        assert _total(quarterly, "total_orders") <= len(expected)
        assert _total(monthly, "order_count") < _total(client.get(MONTHLY).json(), "order_count")

    def test_all_means_unfiltered(self, client):
        assert client.get(MONTHLY, params={"warehouse": "all", "month": "all"}).json() == client.get(MONTHLY).json()

    def test_unknown_warehouse_returns_empty(self, client):
        assert client.get(QUARTERLY, params={"warehouse": "Nowhere"}).json() == []
        assert client.get(MONTHLY, params={"warehouse": "Nowhere"}).json() == []


class TestReportRounding:
    def test_revenue_rounded_to_cents(self, client):
        for row in client.get(MONTHLY).json():
            assert row["revenue"] == round(row["revenue"], 2)
        for row in client.get(QUARTERLY).json():
            assert row["total_revenue"] == round(row["total_revenue"], 2)
