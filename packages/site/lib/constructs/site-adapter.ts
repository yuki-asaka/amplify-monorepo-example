import {Construct} from "constructs";
import {aws_cognito as cognito, aws_ssm as ssm} from "aws-cdk-lib";
import * as constructs from ".";

export class SiteAdapter extends Construct {
  private readonly _appName: string;
  private readonly _userPool: cognito.UserPool;
  private readonly _userPoolClient: cognito.UserPoolClient;

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

  withGithubAuthRestriction(
    appId: string,
    installId: string,
    orgName: string
  ) {
    const ssmName = `/${this._appName}/github-app/cert`;
    const ssmCert = ssm.StringParameter.fromSecureStringParameterAttributes(this, 'PreAuthTriggerSecret', {
      parameterName: ssmName,
      version: 1,
    });

    const preSignUpTrigger = new constructs.BasicLambda(this, 'PreAuthTrigger', {
      appName: this._appName,
      functionName: 'pre-auth-trigger',
    })
      .withSSMParameter(ssmCert)
      .withEnvironment([
        { 'APP_ID': appId },
        { 'INSTALL_ID': installId },
        { 'ORG_NAME': orgName },
        { 'SSM_PARAMETER_NAME': ssmName },
      ])

    // https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-identity-pools-working-with-aws-lambda-triggers.html#lambda-triggers-for-federated-users
    // federated identity has a dedicated trigger
    this._userPool.addTrigger(
      cognito.UserPoolOperation.PRE_AUTHENTICATION,
      preSignUpTrigger.lambda
    )
    return this;
  }
}
