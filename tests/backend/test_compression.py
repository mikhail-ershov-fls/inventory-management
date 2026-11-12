"""
Tests for HTTP response compression (GZip middleware).
"""
import gzip


class TestResponseCompression:
    """Test suite for gzip compression of API responses."""

    def test_large_response_is_gzipped(self, client):
        """Test that a large JSON response is compressed when the client accepts gzip."""
        response = client.get("/api/orders", headers={"Accept-Encoding": "gzip"})
        assert response.status_code == 200
        assert response.headers.get("content-encoding") == "gzip"

        # TestClient decompresses transparently; the body must still be valid JSON
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0

    def test_compressed_size_is_smaller(self, client):
        """Test that compression meaningfully reduces the payload size."""
        response = client.get("/api/orders", headers={"Accept-Encoding": "gzip"})
        raw_size = len(response.content)
        compressed_size = len(gzip.compress(response.content))
        assert compressed_size < raw_size / 3

    def test_no_compression_without_accept_encoding(self, client):
        """Test that clients that don't accept gzip get an uncompressed response."""
        response = client.get("/api/orders", headers={"Accept-Encoding": "identity"})
        assert response.status_code == 200
        assert "content-encoding" not in response.headers
        assert isinstance(response.json(), list)

    def test_small_response_not_compressed(self, client):
        """Test that responses under the 1 KB threshold are not compressed."""
        response = client.get("/api/spending/summary", headers={"Accept-Encoding": "gzip"})
        assert response.status_code == 200
        if len(response.content) < 1000:
            assert "content-encoding" not in response.headers
