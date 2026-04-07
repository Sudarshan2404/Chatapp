import Chat from "./pages/Chat";
import Room from "./pages/Room";
import St500 from "./pages/St500";
import CheckBackend from "./components/CheckBackend";
import { Routes, Route } from "react-router";

const App = () => {
  return (
    <Routes>
      <Route element={<CheckBackend />}>
        <Route path="/" element={<Room />} />
        <Route path="/chat" element={<Chat />} />
      </Route>
      <Route path="/err500" element={<St500 />} />
    </Routes>
  );
};

export default App;
