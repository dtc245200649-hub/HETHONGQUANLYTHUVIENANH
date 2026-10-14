import os
from app import create_app

app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT_BACKEND', 5001))
    print(f">> Gallery Backend API running at: http://localhost:{port}")
    print(f">> Prometheus Metrics endpoint: http://localhost:{port}/metrics")
    app.run(host='0.0.0.0', port=port, debug=False)
