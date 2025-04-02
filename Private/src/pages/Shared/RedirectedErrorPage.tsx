import { useEffect } from 'react';
import { useNavigate } from 'react-router';

export function RedirectedErrorPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/error");
  }, [navigate]);

  return (
    <div>
      <h1>An error occurred!</h1>
      <p>Redirecting to error page...</p>
    </div>
  );
}
