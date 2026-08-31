import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { LoginScreen } from "@/pages/LoginScreen";
import { CreateFamilyScreen } from "@/pages/CreateFamilyScreen";
import { SignInScreen } from "@/pages/SignInScreen";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LoginScreen} />
      <Route path="/create-family" component={CreateFamilyScreen} />
      <Route path="/sign-in" component={SignInScreen} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
