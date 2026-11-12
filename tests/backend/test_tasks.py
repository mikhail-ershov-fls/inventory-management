"""
Tests for the in-memory tasks endpoints.
"""
import pytest

import main


@pytest.fixture(autouse=True)
def clear_tasks():
    """Tasks are module-level state; isolate each test."""
    main.tasks.clear()
    yield
    main.tasks.clear()


def create(client, **overrides):
    payload = {"title": "Review Q4 stock", "priority": "high", "dueDate": "2025-12-01", **overrides}
    return client.post("/api/tasks", json=payload)


class TestTasksEndpoints:
    def test_list_starts_empty(self, client):
        response = client.get("/api/tasks")
        assert response.status_code == 200
        assert response.json() == []

    def test_create_task(self, client):
        response = create(client)
        assert response.status_code == 201
        task = response.json()
        assert task["id"].startswith("task-")
        assert task["title"] == "Review Q4 stock"
        assert task["priority"] == "high"
        assert task["dueDate"] == "2025-12-01"
        assert task["status"] == "pending"

    def test_new_tasks_are_listed_first(self, client):
        first = create(client, title="first").json()
        second = create(client, title="second").json()
        ids = [t["id"] for t in client.get("/api/tasks").json()]
        assert ids == [second["id"], first["id"]]

    def test_priority_defaults_to_medium(self, client):
        response = client.post("/api/tasks", json={"title": "x", "dueDate": "2025-12-01"})
        assert response.status_code == 201
        assert response.json()["priority"] == "medium"

    @pytest.mark.parametrize("payload", [
        {"title": "", "dueDate": "2025-12-01"},
        {"title": "x", "priority": "urgent", "dueDate": "2025-12-01"},
        {"title": "x"},
    ])
    def test_create_rejects_invalid_input(self, client, payload):
        assert client.post("/api/tasks", json=payload).status_code == 422

    def test_toggle_task(self, client):
        task_id = create(client).json()["id"]

        response = client.patch(f"/api/tasks/{task_id}")
        assert response.status_code == 200
        assert response.json()["status"] == "completed"

        response = client.patch(f"/api/tasks/{task_id}")
        assert response.json()["status"] == "pending"

    def test_delete_task(self, client):
        task_id = create(client).json()["id"]

        response = client.delete(f"/api/tasks/{task_id}")
        assert response.status_code == 200
        assert response.json()["id"] == task_id
        assert client.get("/api/tasks").json() == []

    @pytest.mark.parametrize("method", ["patch", "delete"])
    def test_unknown_task_returns_404(self, client, method):
        response = getattr(client, method)("/api/tasks/task-999")
        assert response.status_code == 404
        assert "task-999" in response.json()["detail"]
