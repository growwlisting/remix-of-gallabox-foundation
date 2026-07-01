import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Mail,
  Linkedin,
  MessageCircle,
  Slack,
  Workflow,
  Cloud,
  Database,
  Rocket,
  Sparkles,
  ImageIcon,
  Upload,
} from "lucide-react";

import { PageHeader } from "@/components/states/page-header";
import { withLoading } from "@/components/states/page-skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/settings")({
  component: withLoading(SettingsPage, "default"),
});

function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Settings" description="Configure your GrowthOS workspace." />

      <Tabs defaultValue="general" className="flex flex-col gap-6">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="ai">AI Configuration</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-0">
          <GeneralTab />
        </TabsContent>
        <TabsContent value="team" className="mt-0">
          <PlaceholderTab title="Team" description="Invite teammates and manage roles across your workspace." />
        </TabsContent>
        <TabsContent value="integrations" className="mt-0">
          <IntegrationsTab />
        </TabsContent>
        <TabsContent value="ai" className="mt-0">
          <AIConfigTab />
        </TabsContent>
        <TabsContent value="billing" className="mt-0">
          <PlaceholderTab title="Billing" description="Plans, invoices, and payment methods live here." />
        </TabsContent>
        <TabsContent value="notifications" className="mt-0">
          <PlaceholderTab title="Notifications" description="Choose how and when GrowthOS alerts you." />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PlaceholderTab({ title, description }: { title: string; description: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Configuration coming soon.
        </div>
      </CardContent>
    </Card>
  );
}

function GeneralTab() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Workspace</CardTitle>
          <CardDescription>Basic information about your organization.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workspace-name">Workspace Name</Label>
            <Input id="workspace-name" defaultValue="Acme Revenue" />
          </div>
          <div className="space-y-2">
            <Label>Industry</Label>
            <Select defaultValue="saas">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="saas">B2B SaaS</SelectItem>
                <SelectItem value="fintech">Fintech</SelectItem>
                <SelectItem value="ecommerce">E-commerce</SelectItem>
                <SelectItem value="services">Professional Services</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Company Size</Label>
            <Select defaultValue="51-200">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1-10">1-10 employees</SelectItem>
                <SelectItem value="11-50">11-50 employees</SelectItem>
                <SelectItem value="51-200">51-200 employees</SelectItem>
                <SelectItem value="201-500">201-500 employees</SelectItem>
                <SelectItem value="500+">500+ employees</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Timezone</Label>
            <Select defaultValue="ist">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ist">IST - India Standard Time</SelectItem>
                <SelectItem value="pst">PST - Pacific Standard Time</SelectItem>
                <SelectItem value="est">EST - Eastern Standard Time</SelectItem>
                <SelectItem value="gmt">GMT - Greenwich Mean Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="bg-indigo-600 text-white hover:bg-indigo-700">Save Changes</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Brand & Voice</CardTitle>
          <CardDescription>How GrowthOS speaks and looks for your team.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Primary Color</Label>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg border border-border" style={{ backgroundColor: "#6366F1" }} />
              <code className="rounded-md bg-muted px-2 py-1 text-xs">#6366F1</code>
              <Button variant="outline" size="sm">Change</Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Tone of Voice</Label>
            <Select defaultValue="professional">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="friendly">Friendly</SelectItem>
                <SelectItem value="bold">Bold</SelectItem>
                <SelectItem value="playful">Playful</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Logo</Label>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 p-8 text-center transition-colors hover:border-indigo-500/50 hover:bg-indigo-500/5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <ImageIcon className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">Upload logo</p>
              <p className="text-xs text-muted-foreground">PNG or SVG · up to 2MB</p>
              <Button variant="outline" size="sm" className="mt-1">
                <Upload className="mr-2 h-3.5 w-3.5" />
                Choose file
              </Button>
            </label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const integrations = [
  { name: "Gmail", category: "Email", icon: Mail, color: "bg-red-500/10 text-red-600", connected: true },
  { name: "LinkedIn", category: "Social", icon: Linkedin, color: "bg-blue-500/10 text-blue-600", connected: true },
  { name: "WhatsApp (Gallabox)", category: "Messaging", icon: MessageCircle, color: "bg-emerald-500/10 text-emerald-600", connected: true },
  { name: "Slack", category: "Communication", icon: Slack, color: "bg-violet-500/10 text-violet-600", connected: true },
  { name: "n8n", category: "Automation", icon: Workflow, color: "bg-rose-500/10 text-rose-600", connected: true },
  { name: "Salesforce", category: "CRM", icon: Cloud, color: "bg-sky-500/10 text-sky-600", connected: false },
  { name: "HubSpot", category: "CRM", icon: Rocket, color: "bg-orange-500/10 text-orange-600", connected: false },
  { name: "Apollo", category: "Data", icon: Sparkles, color: "bg-indigo-500/10 text-indigo-600", connected: false },
  { name: "Clay", category: "Data", icon: Database, color: "bg-amber-500/10 text-amber-600", connected: false },
];

function IntegrationsTab() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div>
          <CardTitle>Connected Integrations</CardTitle>
          <CardDescription>Tools plugged into your revenue workflows.</CardDescription>
        </div>
        <button className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">
          Browse All →
        </button>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {integrations.map((int) => {
            const Icon = int.icon;
            return (
              <div
                key={int.name}
                className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:border-indigo-500/40 hover:shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-full", int.color)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{int.name}</p>
                    <p className="text-xs text-muted-foreground">{int.category}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      int.connected
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "border-border bg-muted text-muted-foreground",
                    )}
                  >
                    {int.connected ? "Connected" : "Not Connected"}
                  </Badge>
                  {int.connected ? (
                    <Button variant="outline" size="sm">Disconnect</Button>
                  ) : (
                    <Button size="sm" className="bg-indigo-600 text-white hover:bg-indigo-700">
                      Connect
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function AIConfigTab() {
  const [memory, setMemory] = useState(true);
  const [length, setLength] = useState([50]);
  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>AI Configuration</CardTitle>
        <CardDescription>Tune how your agents think, write, and remember.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Default AI Model</Label>
          <Select defaultValue="gpt-4o">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="gpt-4o">GPT-4o</SelectItem>
              <SelectItem value="claude">Claude 3.5 Sonnet</SelectItem>
              <SelectItem value="gemini">Gemini Pro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Response Tone</Label>
          <Select defaultValue="professional">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="friendly">Friendly</SelectItem>
              <SelectItem value="bold">Bold</SelectItem>
              <SelectItem value="concise">Concise</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Max Response Length</Label>
            <span className="text-xs font-medium text-muted-foreground">
              {length[0] < 33 ? "Short" : length[0] < 66 ? "Medium" : "Long"}
            </span>
          </div>
          <Slider value={length} onValueChange={setLength} max={100} step={1} />
        </div>
        <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-muted/30 p-4">
          <div>
            <Label className="text-sm">AI Memory</Label>
            <p className="mt-1 text-xs text-muted-foreground">
              Allow AI to remember context across sessions.
            </p>
          </div>
          <Switch checked={memory} onCheckedChange={setMemory} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ai-rules">AI Rules</Label>
          <Textarea
            id="ai-rules"
            rows={4}
            defaultValue={`1. Always personalize with a specific buying signal
2. Keep first-touch emails under 100 words
3. Never mention competitors by name
4. Follow the 2-DM max rule on LinkedIn`}
          />
        </div>
        <Button className="bg-indigo-600 text-white hover:bg-indigo-700">Save AI Config</Button>
      </CardContent>
    </Card>
  );
}
