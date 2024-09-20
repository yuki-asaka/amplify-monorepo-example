import path from "path";
import {Construct} from "constructs";
import {
  aws_iam as iam,
  aws_lambda as lambda,
  aws_lambda_nodejs as lambdaNode,
  aws_logs as logs,
  aws_ssm as ssm,
  Duration,
} from "aws-cdk-lib";

export class BasicLambda extends Construct {

  private readonly _lambda: lambda.Function;

  constructor(scope: Construct, id: string, props: {
        appName: string,
        functionName: string,
        timeout?: number,
    }) {
    super(scope, id);

    const role = new iam.Role(this, 'BasicLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    // Add necessary permissions to the role
    role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'));

    this._lambda = new lambdaNode.NodejsFunction(this, 'BasicLambda', {
      role,
      functionName: `${props.appName}-${props.functionName}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: `lib/server/src/${props.functionName}.ts`,
      bundling: {
        // minify: true,
        externalModules: ['@aws-sdk/*'],
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      timeout: Duration.seconds(props.timeout ?? 3),
    });

    return this;
  }

  withSSMParameter(parameters: ssm.IStringParameter | ssm.IStringParameter[]): BasicLambda {
    if (Array.isArray(parameters)) {
      parameters.forEach(parameter => parameter.grantRead(this._lambda));
    } else {
      parameters.grantRead(this._lambda);
    }
    return this;
  }

  withEnvironment(envs: { [key: string]: string }[]): BasicLambda {
    envs.forEach(env => {
      const key = Object.keys(env)[0];
      const value = env[key];
      this._lambda.addEnvironment(key, value);
    });
    return this;
  }

  get lambda(): lambda.Function {
    return this._lambda;
  }
}
