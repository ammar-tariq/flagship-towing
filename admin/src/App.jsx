import { Suspense, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import SuspenseLoader from "./components/SuspenseLoader";
import { ModalProvider } from "./contexts/ModalContext";
import { SwalProvider } from "./contexts/SwalContext";
import MainLayout from "./layout/MainLayout";
import { ROUTES } from "./routes";
import PrivateRoute from "./routes/PrivateRoute";
import ProtectedRoute from "./routes/ProtectedRoute";
import { REACT_APP_MODE } from "./configs/env";
import { onMessageListener, requestForToken } from "./configs/firebase";

function App() {

  const privateNoLayoutRoutes = ROUTES.filter(route => route.private === true && route.layout === false);

  const privateWithLayoutRoutes = ROUTES.filter(route => route.private === true && route.layout === true);

  const publicWithLayoutRoutes = ROUTES.filter(route => route.private === false && route.layout === true);

  const publicNoLayoutRoutes = ROUTES.filter(route => route.private === false && route.layout === false);

  // Vite `base` (e.g. "/staging/") → React Router basename "/staging"
  const rawBase = import.meta.env.BASE_URL || "/";
  const routerBasename =
    rawBase === "/" ? undefined : String(rawBase).replace(/\/$/, "");

  if (REACT_APP_MODE === "production") {
    console.log = () => { }
    console.warn = () => { }
    console.error = () => { }
  }

  useEffect(() => {

    requestForToken()

    onMessageListener().then(payload => {
      console.log("Foreground message received:", payload)
    })

  }, [])

  return (
    <SwalProvider>
      <ModalProvider>
        <BrowserRouter basename={routerBasename}>
          <Toaster position="top-right" reverseOrder={false} />
          <Suspense fallback={<SuspenseLoader />}>
            <Routes>
              <Route element={<ProtectedRoute />}>
                {
                  publicNoLayoutRoutes.map((item, index) => (
                    <Route key={index} path={item.path} element={item.element} />
                  ))
                }
              </Route>
              <Route element={<ProtectedRoute />}>
                <Route element={<MainLayout />}>
                  {
                    publicWithLayoutRoutes.map((item, index) => (
                      <Route key={index} path={item.path} element={item.element} />
                    ))
                  }
                </Route>
              </Route>
              <Route element={<PrivateRoute />}>
                <Route element={<MainLayout />}>
                  {
                    privateWithLayoutRoutes.map((item, index) => (
                      <Route key={index} path={item.path} element={item.element} />
                    ))
                  }
                </Route>
              </Route>
              <Route element={<PrivateRoute />}>
                {
                  privateNoLayoutRoutes.map((item, index) => (
                    <Route key={index} path={item.path} element={item.element} />
                  ))
                }
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ModalProvider>
    </SwalProvider>
  );
}

export default App;
