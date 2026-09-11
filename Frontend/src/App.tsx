import Chat from "./pages/Chat";
import Room from "./pages/Room";
import St500 from "./pages/st500";
import CheckBackend from "./components/CheckBackend";
import { Routes, Route } from "react-router";
import PageNotFound from "./pages/PageNotFound";

const App = () => {
  return (
    <Routes>
      <Route element={<CheckBackend />}>
        <Route path="/" element={<Room />} />
        <Route path="/chat" element={<Chat />} />
      </Route>
      <Route path="/err500" element={<St500 />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

export default App;
