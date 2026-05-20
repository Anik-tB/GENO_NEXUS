import json
from http.server import BaseHTTPRequestHandler, HTTPServer
from typing import List

def double_exponential_smoothing(series: List[float], alpha: float, beta: float, n_preds: int) -> List[int]:
    """
    Holt's Linear Trend Method (Double Exponential Smoothing) in pure Python.
    Good for time series forecasting with a trend but no seasonality.
    """
    if len(series) < 2:
        return [int(series[-1])] * n_preds if series else [0] * n_preds
        
    result = []
    level = series[0]
    trend = series[1] - series[0]
    
    for i in range(1, len(series)):
        val = series[i]
        last_level = level
        level = alpha * val + (1 - alpha) * (level + trend)
        trend = beta * (level - last_level) + (1 - beta) * trend
        
    for i in range(1, n_preds + 1):
        forecast_val = level + i * trend
        result.append(max(0, int(round(forecast_val))))
        
    return result

class ForecastHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/forecast':
            # Read request body
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode('utf-8'))
                historical_points = data.get('historical_points', [])
                horizon_periods = data.get('horizon_periods', 4)
                
                # Math Logic
                float_series = [float(x) for x in historical_points]
                alpha, beta = 0.6, 0.4 
                future = double_exponential_smoothing(float_series, alpha, beta, horizon_periods)
                
                # Send Response
                response_data = {
                    "historical_points": historical_points,
                    "future_points": future
                }
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(response_data).encode('utf-8'))
                
            except Exception as e:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

def run(server_class=HTTPServer, handler_class=ForecastHandler, port=8000):
    server_address = ('127.0.0.1', port)
    httpd = server_class(server_address, handler_class)
    print(f"Epidemiology Engine running on http://127.0.0.1:{port}...")
    httpd.serve_forever()

if __name__ == '__main__':
    run()
