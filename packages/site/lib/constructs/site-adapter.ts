import {Construct} from "constructs";
import {aws_cognito as cognito, aws_ssm as ssm} from "aws-cdk-lib";

export class SiteAdapter extends Construct {
  private _appName: string;
  private _userPool: cognito.UserPool;
  private _userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props: {
        appName: string; userPool: cognito.UserPool; userPoolClient: cognito.UserPoolClient;
    }) {
    super(scope, id);

    this._appName = props.appName;
    this._userPool = props.userPool;
    this._userPoolClient = props.userPoolClient;

    this.exportParameters();
  }


  private exportParameters() {

    if (process.env.APP_NAME === undefined) {
      throw new Error('APP_NAME is not defined');
    }

    new ssm.StringParameter(this, 'user-pool-id', {
      parameterName: `/${this._appName}/user-pool-id`, stringValue: this._userPool.userPoolId,
    });

    const domain = this._userPool.node.findChild('UserPoolDomain') as cognito.UserPoolDomain;
    new ssm.StringParameter(this, 'user-pool-domain-prefix', {
      parameterName: `/${this._appName}/user-pool-domain`, stringValue: domain.domainName,
    });

    const cognitoClientParamName = `/${this._appName}/user-pool-client-id`;
    new ssm.StringParameter(this, 'user-pool-client-id', {
      parameterName: cognitoClientParamName, stringValue: this._userPoolClient.userPoolClientId,
    });
  }
}