import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Menubar } from "primereact/menubar";
import { Card } from "primereact/card";
import { Avatar } from "primereact/avatar";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { Tree } from "primereact/tree";
import TreeNode from "primereact/treenode/treenode";
import { v4 as uuid } from "uuid";
import useDeepCompareEffect from "use-deep-compare-effect";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Chip } from "primereact/chip";

import { axiosInstance } from "../utils/axios";
import { Toast } from "primereact/toast";

interface HomeProps {
  accessToken: string;
  setAccessToken: (token: string) => void;
}

interface Repo {
  id: number;
  visibility?: "public" | "private";
  full_name?: string;
  html_url?: string;
  fork: boolean;
  branches?: Branch[];
  branches_url?: string;
  url?: string;
}

interface Branch {
  name?: string;
  protected: boolean;
  protection: { enabled: boolean; required_status_checks: any };
  protection_url?: string;
  repo?: Repo;
}

const convertApiUrl = (url?: string) => {
  return url?.replace("https://api.github.com", "/api") ?? "";
};

const Home = ({ accessToken, setAccessToken }: HomeProps) => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState<any>();
  const [repos, setRepos] = useState<Repo[]>([]);

  const [parentRepo, setParentRepo] = useState<Repo>();
  const [selectedTargetBranch, setSelectedTargetBranch] = useState<string>("");
  const [isLoadingParent, setLoadingParent] = useState<boolean>(false);

  const [forkUrl, setForkUrl] = useState("");
  const [isForking, setForking] = useState(false);
  const [isForked, setForked] = useState(true);
  const [isOpenPRDialog, setOpenPRDialog] = useState(false);
  const [isCreatingPR, setCreatingPR] = useState(false);
  const [prMSG, setPRMSG] = useState("");

  const toast = useRef<any>();
  const [nodes, setNodes] = useState<TreeNode[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Branch>();

  const items = [
    {
      label: "Log out",
      icon: "pi pi-fw pi-power-off",
      command: () => {
        localStorage.clear();
        setAccessToken("");
        navigate("/sign-in");
      },
    },
  ];

  useEffect(() => {
    if (!accessToken) {
      navigate("/sign-in");
    }

    getUserInfo();
    getRepos();
  }, [accessToken]);

  useDeepCompareEffect(() => {
    const tmpNodes: TreeNode[] = repos
      .filter(({ fork }) => (isForked ? fork : true))
      .map((repo) => {
        return {
          key: repo.id,
          label: repo.full_name,
          leaf: false,
          data: repo,
          ...(repo.branches?.length
            ? {
                children: repo.branches.map((branch) => ({
                  key: uuid(),
                  label: branch.name,
                  data: branch,
                  leaf: true,
                })),
              }
            : {}),
        };
      });

    setNodes(tmpNodes);
  }, [repos]);

  const parentBranchOptions =
    parentRepo?.branches?.map((branch) => {
      return {
        label: branch.name,
        value: branch.name,
      };
    }) ?? [];

  const [isLoadingRepo, setLoadingRepo] = useState(false);

  const loadOnExpand = (event: any) => {
    if (!event.node.children) {
      getBranches(event.node.data);
    }
  };

  const getUserInfo = async () => {
    const res = await axiosInstance.get("/api/user");
    setUserInfo(res?.data ?? {});
  };

  const getRepos = async () => {
    setLoadingRepo(true);
    try {
      const res = await axiosInstance.get("/api/user/repos");
      setRepos(res?.data ?? []);
    } catch (error: any) {
      toast.current.show({
        severity: "error",
        summary: "Failed",
        detail: error?.message ?? "Could not get your repositories!",
      });
    }

    setLoadingRepo(false);
  };

  const getBranches = async (repo: Repo) => {
    setLoadingRepo(true);
    try {
      const branchURL = convertApiUrl(repo?.branches_url)?.replace("{/branch}", "") ?? "";
      const res = await axiosInstance.get(branchURL, {
        params: {
          per_page: 100,
        },
      });
      setRepos(
        repos.map((e) => {
          if (e.id === repo.id) {
            e = {
              ...e,
              branches: res.data,
            };
          }
          return e;
        })
      );
    } catch (error: any) {
      toast.current.show({
        severity: "error",
        summary: "Failed",
        detail: error?.message ?? `Could not get the branches of ${repo.full_name}!`,
      });
    }
    setLoadingRepo(false);
  };

  const handleForkClick = async () => {
    if (!forkUrl) return;
    setForking(true);
    try {
      const forkUrlObj = forkUrl.split("/");
      const repoName = forkUrlObj.pop();
      const userName = forkUrlObj.pop();

      await axiosInstance.post(`/api/repos/${userName}/${repoName}/forks`);

      toast.current.show({ severity: "success", summary: "Forked a repo", detail: "Success" });
    } catch (error: any) {
      toast.current.show({ severity: "error", summary: "Failed to fork", detail: error?.message ?? "Unknown error" });
    }
    setForking(false);
    getRepos();
  };

  const handleCreatePRClick = async () => {
    setLoadingParent(true);

    try {
      const repoURL = convertApiUrl(selectedBranch?.repo?.url);
      const { data: { parent } = {} } = await axiosInstance.get(repoURL);
      if (!parent) {
        throw new Error("Could not get parent info!");
      }

      const branchURL = convertApiUrl(parent?.branches_url)?.replace("{/branch}", "") ?? "";
      const { data } = await axiosInstance.get(branchURL, {
        params: {
          per_page: 100,
        },
      });

      setParentRepo({
        ...parent,
        branches: data,
      });

      setSelectedTargetBranch(parent?.default_branch ?? "master");
    } catch (error: any) {
      toast.current.show({
        severity: "error",
        summary: "Failed to create PR",
        detail: error?.message ?? "Could not get parent repo info.",
      });
    }

    setLoadingParent(false);
    setOpenPRDialog(true);
  };

  const forkFooter = (
    <span>
      <Button loading={isForking} disabled={!forkUrl} onClick={handleForkClick} label="Fork"></Button>
    </span>
  );

  const branchesFooter = (
    <Button
      loading={isLoadingParent}
      disabled={!selectedBranch || !Object.keys(selectedBranch).length}
      onClick={handleCreatePRClick}
      label="Create PR"
    />
  );

  const handleSelectionChange = (e: any) => {
    let matchNode: TreeNode | undefined;
    const repository = nodes.find(({ children }) => {
      matchNode = children?.find(({ key }) => key === e.value);
      return !!matchNode;
    });

    if (!matchNode) return;

    setSelectedBranch({
      ...matchNode.data,
      repo: repository?.data,
    });
  };

  const handleConfirmDialog = async () => {
    setCreatingPR(true);
    try {
      const payload = {
        title: prMSG,
        body: "Creating pr from api",
        head: `${selectedBranch?.repo?.full_name?.split("/")?.[0]}:${selectedBranch?.name}`,
        base: selectedTargetBranch,
      };
      await axiosInstance.post(`/api/repos/${parentRepo?.full_name}/pulls`, payload);

      toast.current.show({ severity: "success", summary: "Created a PR", detail: "Success" });
    } catch (error: any) {
      toast.current.show({ severity: "error", summary: "Failed", detail: error?.message ?? "Unknown error" });
    }
    setCreatingPR(false);
    setOpenPRDialog(false);
  };

  const renderFooter = () => {
    return (
      <div>
        <Button label="No" icon="pi pi-times" onClick={() => setOpenPRDialog(false)} className="p-button-text" />
        <Button
          label="Yes"
          icon="pi pi-check"
          disabled={!selectedTargetBranch || !prMSG}
          onClick={handleConfirmDialog}
          autoFocus
        />
      </div>
    );
  };

  return (
    <div className="flex flex-column">
      <Toast ref={toast} />

      <Menubar model={items} />

      <div className="flex flex-row">
        <div className="col-4">
          <Card title="User Info">
            {userInfo && (
              <div className="flex flex-column">
                <div className="flex justify-content-center align-items center">
                  <Avatar image={userInfo.avartar_url} />
                </div>
                <div className="flex flex-column justify-content-start p-3">
                  <span className="py-2" style={{ textAlign: "start" }}>
                    User Name: {userInfo.name}
                  </span>
                  <span className="py-2" style={{ textAlign: "start" }}>
                    User Id: {userInfo.login}
                  </span>
                </div>
              </div>
            )}
          </Card>
          <Card title="Fork" footer={forkFooter}>
            <div>
              <InputText id="in" value={forkUrl} onChange={(e) => setForkUrl(e.target.value)} />
            </div>
          </Card>
        </div>
        <div className="col">
          <Card title="Forked Repositories" footer={branchesFooter}>
            <Tree
              selectionMode="single"
              value={nodes}
              onExpand={loadOnExpand}
              onSelectionChange={handleSelectionChange}
              loading={isLoadingRepo}
            />
          </Card>
        </div>
      </div>
      <Dialog
        header={"Create Pull Request"}
        visible={isOpenPRDialog}
        style={{ width: "600px" }}
        footer={renderFooter()}
        onHide={() => setOpenPRDialog(false)}
      >
        <div className="flex flex-row align-items-center p-fluid field col-12">
          <Chip label={`${parentRepo?.full_name}:${selectedTargetBranch}`} />
          <i className="pi pi-arrow-left p-1"></i>
          <Chip label={`${selectedBranch?.repo?.full_name}:${selectedBranch?.name}`} />
        </div>
        <div className="p-fluid field col-12">
          <Dropdown
            value={selectedTargetBranch}
            options={parentBranchOptions}
            onChange={(e) => setSelectedTargetBranch(e.value)}
            placeholder="Select a target branch"
          />
        </div>
        <div className="p-fluid field col-12 mt-3">
          <span className="p-float-label">
            <InputText id="pr-message" value={prMSG} onChange={(e) => setPRMSG(e.target.value)} />
            <label htmlFor="pr-message" className="p-checkbox-label pl-2">
              Pull request message
            </label>
          </span>
        </div>
      </Dialog>
    </div>
  );
};

export default Home;
