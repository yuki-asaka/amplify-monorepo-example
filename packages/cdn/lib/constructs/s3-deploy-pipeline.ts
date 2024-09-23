import {Construct} from "constructs";
import {
    aws_codebuild as codebuild,
    aws_codepipeline as pipeline,
    aws_codepipeline_actions as pipelineActions,
    aws_iam as iam,
    aws_s3 as s3,
} from "aws-cdk-lib";


export class S3DeployPipeline extends Construct {
    private readonly _appName: string;
    private _repo: { branch: string; name: string; owner: string };
    private _artifactBucket: s3.IBucket;

    constructor(scope: Construct, id: string, props: {
        appName: string,
        artifactBucket: s3.IBucket,
        codeConnectionsArn: string,
        repo: {
            branch: string,
            name: string,
            owner: string,
        },
        sourcePath?: string,
    }) {
        super(scope, id);

        this._appName = props.appName;
        this._artifactBucket = props.artifactBucket;
        this._repo = props.repo;

        const sourceArtifact = new pipeline.Artifact('SourceArtifact');
        const buildArtifact = new pipeline.Artifact('BuildArtifact');

        const p = new pipeline.Pipeline(this, 'Pipeline', {
            pipelineName: `${this._appName}-pipeline`,
            stages: [
                this._sourceStage(props.codeConnectionsArn, sourceArtifact),
                this._buildStage(props.sourcePath || '', sourceArtifact, buildArtifact),
                this._deployStage(buildArtifact),
            ]
        });

        this._artifactBucket.grantReadWrite(p.role);
    }

    private _sourceStage(codeConnectionsArn: string, artifact: pipeline.Artifact): pipeline.StageProps {
        return {
            stageName: 'Source',
            actions: [
                new pipelineActions.CodeStarConnectionsSourceAction({
                    actionName: 'CodeStarConnectionsSource',
                    owner: this._repo.owner,
                    repo: this._repo.name,
                    branch: this._repo.branch,
                    connectionArn: codeConnectionsArn,
                    output: artifact,
                    variablesNamespace: 'SourceVariables',
                }),
            ],
        };
    }

    private _buildStage(sourcePath: string, sourceArtifact: pipeline.Artifact, buildArtifact: pipeline.Artifact): pipeline.StageProps {
        const role = new iam.Role(this, 'CodeBuildRole', {
            roleName: `${this._appName}-codebuild-role`,
            assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
        });

        let preBuildCommands: string[] = [];
        if (sourcePath) {
            preBuildCommands =  [
                'echo "changing to specific directory"',
                `cd ${sourcePath}`,
            ]
        }

        return {
            stageName: 'Build',
            actions: [
                new pipelineActions.CodeBuildAction({
                    actionName: 'CodeBuild',
                    input: sourceArtifact,
                    outputs: [buildArtifact],
                    project: new codebuild.Project(this, 'CodeBuildProject', {
                        projectName: `${this._appName}-build`,
                        role,
                        environment: {
                            buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
                            privileged: true,
                        },
                        environmentVariables: {
                          Commit_ID: {
                              type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
                              value: '#{SourceVariables.CommitId}'
                          },
                        },
                        buildSpec:　codebuild.BuildSpec.fromObject({
                            version: '0.2',
                            phases: {
                                install: {
                                    commands: [
                                        'npm install',
                                    ],
                                },
                                pre_build: {
                                    commands: preBuildCommands,
                                },
                                build: {
                                    commands: [
                                        'npm run build',
                                    ],
                                },
                            },
                            artifacts: {
                                files: [
                                    'dist/**/*',
                                ],
                            },
                        }),
                    })
                }),
            ],
        }
    }

    private _deployStage(buildArtifact: pipeline.Artifact): pipeline.StageProps {
        return {
            stageName: 'Deploy',
            actions: [
                new pipelineActions.S3DeployAction({
                    actionName: 'S3Deploy',
                    input: buildArtifact,
                    bucket: this._artifactBucket,
                }),
            ],
        }
    }
}