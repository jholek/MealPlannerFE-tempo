import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { runParserTests } from "@/lib/__tests__/ingredientParser.test";
import { ScrollArea } from "../ui/scroll-area";

export default function ParserDebugDialog() {
  const [testInput, setTestInput] = useState("");
  const [output, setOutput] = useState<string>("");

  const handleTest = async () => {
    // Capture console.log output
    const logs: string[] = [];
    const originalConsoleLog = console.log;
    console.log = (...args) => {
      logs.push(
        args
          .map((arg) =>
            typeof arg === "object" ? JSON.stringify(arg, null, 2) : arg,
          )
          .join(" "),
      );
    };

    await runParserTests(testInput);

    // Restore original console.log
    console.log = originalConsoleLog;

    // Update output
    setOutput(logs.join("\n"));
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Debug Parser
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl w-screen h-[90vh]">
        <DialogHeader>
          <DialogTitle>Parser Debug Tool</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <Label>Test Input</Label>
            <Textarea
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              placeholder="Enter ingredient lines to test..."
              className="h-[100px] font-mono"
            />
          </div>

          <Button onClick={handleTest}>Run Test</Button>

          <div>
            <Label>Output</Label>
            <ScrollArea className="h-[400px] w-full border rounded-md">
              <pre className="p-4 text-sm font-mono whitespace-pre-wrap">
                {output}
              </pre>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
