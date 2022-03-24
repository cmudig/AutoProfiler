import { ISessionContext } from '@jupyterlab/apputils';

/**
 * Simplified adaption of https://github.com/lckr/jupyterlab-variableInspector
 */
export default class KernelAPI {
  session: ISessionContext;

  constructor(session: ISessionContext) {
    this.session = session;
  }

  get language(): Promise<string> {
    return this.session.session.kernel.info.then(infoReply => {
      return infoReply.language_info.name;
    });
  }

  get name(): string {
    return this.session.kernelDisplayName;
  }

  // ready is a Promise that resolves once the kernel is ready to use
  get ready(): Promise<void> {
    return this.session.ready;
  }

  public async getEnv() {
    // make sure kernel is ready to run code
    await this.ready;

    // first get the variable names
    let var_names = await this.getVariableNames();

    // then get the variable types
    if (var_names) {
      let var_types = await this.getType(var_names);

      return { names: var_names, types: var_types };
    }
  }

  public runCode(
    code: string,
    onReply?: (type: string, content) => void,
    onDone?: (string?) => void
  ) {
    let future = this.session.session.kernel.requestExecute({
      code,
      stop_on_error: true
    });

    // this is the output of the execution, may return things multiple times as code runs
    future.onIOPub = msg => {
      var msg_type = msg.header.msg_type;
      if (
        msg_type === 'execute_result' ||
        msg_type === 'stream' ||
        msg_type === 'display_data'
      )
        if (onReply) onReply(msg_type + '', msg.content);
    };

    // when execution is done
    future.done.then(
      reply => {
        console.log(
          'Code execution finished with status: ',
          reply.content.status
        );
        if (onDone) onDone(reply.content.status);
      },
      error => {
        console.error('Code run failed: ', error);
        if (onDone) onDone();
      }
    );
  }

  private async getVariableNames(): Promise<string[]> {
    let code = '%who_ls'; // a python magic command

    return new Promise<string[]>(resolve => {
      let onReply = (type: string, content) => {
        if (type == 'execute_result') {
          // parse data into usable format
          let data = (content.data['text/plain'] + '').replace(/'/g, '"');
          let jsn = `{"names": ${data}}`;
          let names = JSON.parse(jsn).names;

          // return variable names
          resolve(names);
        }
      };

      let onDone = () => resolve();

      this.runCode(code, onReply, onDone);
    });
  }

  private async getType(varNames: string[]): Promise<string[]> {
    let code_lines = [];
    varNames.forEach(name => code_lines.push(`print(type(${name}).__name__)`));

    return new Promise<string[]>(resolve => {
      let onReply = (type: string, content) => {
        if (type === 'stream') {
          // get types in a usable format
          let response: string[] = content.text.split('\n');
          response.pop();

          // return types
          resolve(response);
        }
      };

      let onDone = () => resolve();

      this.runCode(code_lines.join('\n'), onReply, onDone);
    });
  }
}
