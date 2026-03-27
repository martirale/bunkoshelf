declare module "*.css";

interface NavigatorUAData {
  platform: string;
}

interface Navigator {
  userAgentData?: NavigatorUAData;
}
