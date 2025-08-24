import TaskRequestForm from "./TaskRequestForm";
import { AppFooter } from "@/components/AppFooter";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center py-8">
      <TaskRequestForm />
      <AppFooter />
    </div>
  );
};

export default Index;